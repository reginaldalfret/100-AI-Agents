import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LOCAL_MODELS } from '../../platform/models/model-registry.js';

describe('Legacy Gemma 3 and Gemma 2 Removal Verification', () => {
  it('confirms gemma3-4b is removed from production LOCAL_MODELS', () => {
    const gemma3 = LOCAL_MODELS.find(m => m.model_id === 'gemma3-4b' || m.ollama_name === 'gemma3:4b');
    assert.equal(gemma3, undefined, 'gemma3:4b must NOT exist in active production model registry');
  });

  it('confirms gemma2-2b is removed from production LOCAL_MODELS', () => {
    const gemma2 = LOCAL_MODELS.find(m => m.model_id === 'gemma2-2b' || m.ollama_name === 'gemma2:2b');
    assert.equal(gemma2, undefined, 'gemma2:2b must NOT exist in active production model registry');
  });
});
