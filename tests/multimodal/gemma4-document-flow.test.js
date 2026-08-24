import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { classifyTask } from '../../platform/models/task-classifier.js';
import { processDocumentOCR } from '../../platform/multimodal/ocr-engine.js';

describe('Authoritative Document Intelligence & OCR Pipeline Test Suite', () => {
  it('routes scanned PDF and document tasks to dedicated local OCR', () => {
    const res = classifyTask({ prompt: 'Extract scanned text from this pdf document' });
    assert.equal(res.preferred_model_id, 'local-vision-ocr');
    assert.equal(res.primary_modality, 'ocr');
  });

  it('routes image visual extraction to local OCR engine', () => {
    const res = classifyTask({ prompt: 'Inspect this image for mechanical defects' });
    assert.equal(res.preferred_model_id, 'local-vision-ocr');
    assert.equal(res.primary_modality, 'vision');
  });

  it('processes document attachment and isolates metadata from text', async () => {
    const docRes = await processDocumentOCR({
      name: 'invoice-sample.pdf',
      type: 'application/pdf',
      data: Buffer.from('Sample PDF content').toString('base64')
    });
    assert.ok(docRes);
    assert.ok(docRes.fileName);
    assert.ok(docRes.metadata);
    assert.equal(docRes.is_air_gapped, true);
    assert.ok(!docRes.fullText.includes('sha256:'));
    assert.ok(!docRes.fullText.includes('jumbf'));
  });
});

