import test from 'node:test';
import assert from 'node:assert/strict';
import { getModelById, isCpuModel, RuntimeType } from '../../platform/models/model-registry.js';
import { routeTaskToLocalModel } from '../../platform/models/model-router.js';

test('Meta MobileLLM-Pro 1B Model Registry & CPU Architecture', async (t) => {
  await t.test('MobileLLM-Pro 1B is registered as CPU-only model', () => {
    const model = getModelById('mobilellm-pro-1b');
    assert.ok(model, 'MobileLLM-Pro 1B must be registered in LOCAL_MODELS');
    assert.strictEqual(model.execution_target, 'CPU');
    assert.strictEqual(model.provider, 'Meta Reality Labs');
    assert.strictEqual(model.runtime_type, RuntimeType.EXECUTORCH);
    assert.strictEqual(model.quantization, 'INT4');
    assert.strictEqual(model.vram_mb, 0);
  });

  await t.test('isCpuModel correctly classifies MobileLLM-Pro', () => {
    assert.strictEqual(isCpuModel('mobilellm-pro-1b'), true);
    assert.strictEqual(isCpuModel('mobilellm-pro'), true);
    assert.strictEqual(isCpuModel('facebook/MobileLLM-Pro-1B'), true);
  });

  await t.test('Manual override routes to MobileLLM-Pro 1B', async () => {
    const result = await routeTaskToLocalModel({
      model_override: 'mobilellm-pro-1b',
      prompt: 'Help me plan a project review meeting.'
    });
    assert.strictEqual(result.selected_model, 'mobilellm-pro-1b');
    assert.strictEqual(result.hardware_footprint.vram_mb, 0);
  });
});
