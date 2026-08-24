import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { documentExtractor } from '../../platform/multimodal/document-extractor.js';

test('5. Native PDF Extraction Performance Benchmark', async () => {
  const filePath = path.resolve('tests/multimodal/fixtures/project-review-request-fixed.pdf');
  const buffer = fs.readFileSync(filePath);
  const base64Data = buffer.toString('base64');

  const startTime = performance.now();
  const doc = await documentExtractor.extractContent({
    name: 'project_review_request_fixed.pdf',
    type: 'application/pdf',
    data: base64Data
  });
  const durationMs = performance.now() - startTime;

  assert.ok(durationMs < 5000, `PDF extraction must complete quickly (< 5000ms). Took: ${durationMs.toFixed(2)}ms`);
  assert.strictEqual(doc.needsVision, false, 'No visual model invocation allowed for native text PDF');
  assert.ok(doc.contentText.includes('Write a professional email to my manager requesting a project review'));
});
