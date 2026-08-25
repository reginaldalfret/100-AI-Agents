import test from 'node:test';
import assert from 'node:assert/strict';
import { LOCAL_MODELS, getGpuModels, getCpuModels, isCpuModel } from '../../platform/models/model-registry.js';
import { routeTaskToLocalModel } from '../../platform/models/model-router.js';

test('Hardware Tier Routing & Partitioning', async (t) => {
  await t.test('GPU models are strictly partitioned from CPU models', () => {
    const gpuModels = getGpuModels();
    const cpuModels = getCpuModels();

    assert.ok(gpuModels.length >= 7, 'Should have at least 7 GPU models');
    assert.ok(cpuModels.length >= 1, 'Should have at least 1 CPU model (LFM2.5 350M)');

    gpuModels.forEach(m => {
      assert.strictEqual(m.execution_target, 'GPU', `Model ${m.model_id} should be GPU`);
      assert.ok(m.vram_mb > 0, `GPU model ${m.model_id} should have positive VRAM footprint`);
    });

    cpuModels.forEach(m => {
      assert.strictEqual(m.execution_target, 'CPU', `Model ${m.model_id} should be CPU`);
      assert.strictEqual(m.vram_mb, 0, `CPU model ${m.model_id} must have 0 VRAM footprint`);
    });
  });

  await t.test('Manual override routes to LFM2.5 350M CPU model', async () => {
    const result = await routeTaskToLocalModel({
      model_override: 'lfm2.5-350m',
      task: 'Extract the main points from the inspection report'
    });
    assert.strictEqual(result.selected_model, 'lfm2.5-350m');
    assert.strictEqual(result.hardware_footprint.vram_mb, 0);
  });
});
