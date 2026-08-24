import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { routeTaskToLocalModel } from '../../platform/models/model-router.js';
import { LOCAL_MODELS } from '../../platform/models/model-registry.js';

describe('Gemma 4 E2B Model Routing & Registry', () => {
  it('verifies Gemma 4 E2B is registered in LOCAL_MODELS with correct tag and properties', () => {
    const gemmaModel = LOCAL_MODELS.find(m => m.model_id === 'gemma4-e2b');
    assert.ok(gemmaModel, 'gemma4-e2b must exist in model registry');
    assert.equal(gemmaModel.ollama_name, 'gemma4:e2b');
    assert.ok(gemmaModel.supported_modalities.includes('vision'));
    assert.ok(gemmaModel.supported_modalities.includes('text'));
  });

  it('routes explicit gemma override to gemma4-e2b', async () => {
    const res = await routeTaskToLocalModel({ model_override: 'gemma4:e2b', prompt: 'Analyze this image' });
    assert.equal(res.selected_model, 'gemma4-e2b');
  });

  it('routes visual inspection tasks to gemma4-e2b', async () => {
    const res = await routeTaskToLocalModel({ prompt: 'Analyze this photograph of equipment corrosion' });
    assert.equal(res.selected_model, 'gemma4-e2b');
  });

  it('does NOT route code tasks to gemma4-e2b', async () => {
    const res = await routeTaskToLocalModel({ prompt: 'Write a Python palindrome script' });
    assert.equal(res.selected_model, 'local-code-specialist');
  });
});
