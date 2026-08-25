import test from 'node:test';
import assert from 'node:assert/strict';
import { getModelById, isCpuModel, RuntimeType } from '../../platform/models/model-registry.js';
import { routeTaskToLocalModel } from '../../platform/models/model-router.js';

test('Apple OpenELM 450M Model Registry & CPU Architecture', async (t) => {
  await t.test('Apple OpenELM 450M is registered as CPU-only model', () => {
    const model = getModelById('openelm-450m');
    assert.ok(model, 'OpenELM 450M must be registered in LOCAL_MODELS');
    assert.strictEqual(model.execution_target, 'CPU');
    assert.strictEqual(model.provider, 'Apple');
    assert.strictEqual(model.runtime_type, RuntimeType.PYTORCH);
    assert.strictEqual(model.vram_mb, 0);
  });

  await t.test('Apple OpenELM 1.1B is registered as optional future candidate', () => {
    const model = getModelById('openelm-1.1b');
    assert.ok(model, 'OpenELM 1.1B should be registered in LOCAL_MODELS');
    assert.strictEqual(model.execution_target, 'CPU');
    assert.strictEqual(model.provider, 'Apple');
  });

  await t.test('isCpuModel correctly classifies OpenELM', () => {
    assert.strictEqual(isCpuModel('openelm-450m'), true);
    assert.strictEqual(isCpuModel('openelm'), true);
    assert.strictEqual(isCpuModel('apple/OpenELM-450M-Instruct'), true);
    assert.strictEqual(isCpuModel('openelm-1.1b'), true);
  });

  await t.test('Manual override routes to OpenELM 450M', async () => {
    const result = await routeTaskToLocalModel({
      model_override: 'openelm-450m',
      prompt: 'Summarize the meeting minutes in 3 bullet points.'
    });
    assert.strictEqual(result.selected_model, 'openelm-450m');
    assert.strictEqual(result.hardware_footprint.vram_mb, 0);
  });
});
