import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { imageQuestionPipeline } from '../../platform/multimodal/image-question-pipeline.js';

test('Image OCR E2E: Real User Image Extraction & Classification', async () => {
  const fixturePath = path.resolve('tests/multimodal/fixtures/chatgpt-image-real.png');
  assert.ok(fs.existsSync(fixturePath), 'Test fixture chatgpt-image-real.png must exist');

  const buf = fs.readFileSync(fixturePath);
  assert.ok(buf.length > 0, 'Fixture buffer must not be empty');
  const base64 = 'data:image/png;base64,' + buf.toString('base64');

  const res = await imageQuestionPipeline.processImageQuestion({
    name: 'chatgpt-image-real.png',
    filePath: fixturePath,
    type: 'image/png',
    data: base64
  });

  // 1. Source verification
  assert.equal(res.sourceType, 'image');
  assert.equal(res.fileName, 'chatgpt-image-real.png');

  // 2. OCR text extraction
  assert.ok(res.text.includes('Write a professional email'), 'Must extract line 1: Write a professional email');
  assert.ok(res.text.includes('to my manager requesting a project review'), 'Must extract line 2: to my manager requesting a project review');

  // 3. Confidence level >= 0.90
  assert.ok(res.confidence >= 0.90, `Confidence must be >= 0.90, got: ${res.confidence}`);
  assert.equal(res.confidenceLevel, 'HIGH');

  // 4. Task classification & specialist resolution
  assert.equal(res.classification.taskType, 'EMAIL_WRITING');
  assert.equal(res.classification.agentId, 'agent-002');
  assert.equal(res.classification.agentName, 'Email AI Agent');
  assert.equal(res.classification.recommendedModel, 'nemotron-3-nano:latest');

  // 5. Clean structured evidence block & prompt
  assert.ok(res.evidenceBlock.includes('[IMAGE OCR EVIDENCE]'), 'Evidence block must start with [IMAGE OCR EVIDENCE]');
  assert.ok(res.evidenceBlock.includes('[/IMAGE OCR EVIDENCE]'), 'Evidence block must end with [/IMAGE OCR EVIDENCE]');
  assert.ok(res.evidenceBlock.includes('Source: chatgpt-image-real.png'));
  assert.ok(res.effectivePrompt.includes('Please fulfill the above request'));

  // 6. Zero external calls & air-gapped guarantees
  assert.equal(res.is_air_gapped, true, 'Processing must be 100% air-gapped');
  assert.equal(res.external_calls, 0, 'Must have zero external calls');
  assert.equal(res.backendTrace.externalCalls, 0);
  assert.equal(res.backendTrace.hardware, 'NVIDIA RTX 2050');
});
