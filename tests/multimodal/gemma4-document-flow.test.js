import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { classifyTask } from '../../platform/models/task-classifier.js';

describe('Gemma 4 E2B and Document Intelligence Two-Stage Pipeline', () => {
  it('routes scanned PDF tasks to dedicated local OCR first', () => {
    const res = classifyTask({ prompt: 'Extract scanned text from this pdf document' });
    assert.equal(res.preferred_model_id, 'local-vision-ocr');
    assert.equal(res.primary_modality, 'ocr');
  });

  it('routes image visual reasoning to Gemma 4 E2B', () => {
    const res = classifyTask({ prompt: 'Inspect this image for mechanical defects' });
    assert.equal(res.preferred_model_id, 'gemma4-e2b');
    assert.equal(res.primary_modality, 'vision');
  });
});
