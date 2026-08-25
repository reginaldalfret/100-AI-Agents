import test from 'node:test';
import assert from 'node:assert/strict';
import { getModelById, isCpuModel, RuntimeType } from '../../platform/models/model-registry.js';
import { routeTaskToLocalModel } from '../../platform/models/model-router.js';

test('Meta MobileLLM 350M Model Registry & CPU Architecture', async (t) => {
  await t.test('MobileLLM 350M is registered as ultra-light CPU edge model', () => {
    const model = getModelById('mobilellm-350m');
    assert.ok(model, 'MobileLLM 350M must be registered in LOCAL_MODELS');
    assert.strictEqual(model.execution_target, 'CPU');
    assert.strictEqual(model.provider, 'Meta');
    assert.strictEqual(model.runtime_type, RuntimeType.EXECUTORCH);
    assert.strictEqual(model.quantization, 'INT4');
    assert.strictEqual(model.vram_mb, 0);
  });

  await t.test('isCpuModel correctly classifies MobileLLM 350M', () => {
    assert.strictEqual(isCpuModel('mobilellm-350m'), true);
    assert.strictEqual(isCpuModel('mobilellm'), true);
    assert.strictEqual(isCpuModel('facebook/MobileLLM-350M'), true);
  });

  await t.test('Manual override routes to MobileLLM 350M', async () => {
    const result = await routeTaskToLocalModel({
      model_override: 'mobilellm-350m',
      prompt: 'Classify this user intent.'
    });
    assert.strictEqual(result.selected_model, 'mobilellm-350m');
    assert.strictEqual(result.hardware_footprint.vram_mb, 0);
  });
});
