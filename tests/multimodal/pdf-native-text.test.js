import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { documentExtractor } from '../../platform/multimodal/document-extractor.js';

test('1. Native Text PDF Extraction extracts exact content and avoids vision', async () => {
  const filePath = path.resolve('tests/multimodal/fixtures/project-review-request-fixed.pdf');
  const buffer = fs.readFileSync(filePath);
  const base64Data = buffer.toString('base64');

  const doc = await documentExtractor.extractContent({
    name: 'project_review_request_fixed.pdf',
    type: 'application/pdf',
    data: base64Data
  });

  assert.strictEqual(doc.docType, 'pdf', 'Document type must be pdf');
  assert.strictEqual(doc.pageCount, 1, 'PDF must have pageCount 1');
  assert.strictEqual(doc.needsVision, false, 'Native text PDF must NOT require vision/Gemma');
  assert.strictEqual(doc.isMultimodalImage, false, 'Native text PDF must NOT be marked as multimodal image');

  const expectedText = 'Write a professional email to my manager requesting a project review';
  assert.ok(
    doc.contentText.includes(expectedText),
    `Extracted contentText should contain exact expected phrase. Received: "${doc.contentText}"`
  );

  assert.ok(
    !doc.contentText.toLowerCase().includes('c2pa'),
    'contentText must NOT contain C2PA metadata strings'
  );
  assert.ok(
    !doc.contentText.toLowerCase().includes('xmpmeta'),
    'contentText must NOT contain XMP metadata tags'
  );
});
