import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { routeTaskToLocalModel } from '../../platform/models/model-router.js';
import { LOCAL_MODELS } from '../../platform/models/model-registry.js';

describe('Google Gemma 3 1B Model Routing & Registry', () => {
  it('verifies Gemma 3 1B is registered in LOCAL_MODELS with correct tag and text-only properties', () => {
    const gemmaModel = LOCAL_MODELS.find(m => m.model_id === 'gemma3-1b');
    assert.ok(gemmaModel, 'gemma3-1b must exist in model registry');
    assert.equal(gemmaModel.ollama_name, 'gemma3:1b');
    assert.ok(gemmaModel.supported_modalities.includes('text'));
    assert.equal(gemmaModel.supported_modalities.includes('vision'), false, 'Gemma 3 1B is strictly text-only');
  });

  it('routes explicit gemma override to gemma3-1b', async () => {
    const res = await routeTaskToLocalModel({ model_override: 'gemma3:1b', prompt: 'Summarize this paragraph' });
    assert.equal(res.selected_model, 'gemma3-1b');
  });

  it('routes modelMode gemma to gemma3-1b', async () => {
    const res = await routeTaskToLocalModel({ modelMode: 'gemma', prompt: 'Rewrite this sentence' });
    assert.equal(res.selected_model, 'gemma3-1b');
  });

  it('does NOT route code tasks to gemma3-1b', async () => {
    const res = await routeTaskToLocalModel({ prompt: 'Write a Python palindrome script' });
    assert.equal(res.selected_model, 'local-code-specialist');
  });
});
