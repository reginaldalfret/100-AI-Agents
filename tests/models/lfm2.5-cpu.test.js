import test from 'node:test';
import assert from 'node:assert/strict';
import { LOCAL_MODELS, getModelById, isCpuModel, getCpuModels } from '../../platform/models/model-registry.js';

test('LFM2.5 Model Registry and CPU Tiering', async (t) => {
  await t.test('Liquid AI LFM2.5 is registered with execution_target: CPU', () => {
    const lfm = getModelById('lfm2.5-1.2b-instruct');
    assert.ok(lfm, 'LFM2.5 model should be registered');
    assert.strictEqual(lfm.execution_target, 'CPU', 'LFM2.5 must have execution_target CPU');
    assert.strictEqual(lfm.provider, 'Liquid AI');
    assert.strictEqual(lfm.vram_mb, 0, 'LFM2.5 must allocate 0 MB VRAM');
    assert.strictEqual(lfm.endpoint_options?.num_gpu, 0, 'num_gpu must be strictly 0');
  });

  await t.test('isCpuModel correctly identifies LFM2.5 and aliases', () => {
    assert.strictEqual(isCpuModel('lfm2.5-1.2b-instruct'), true);
    assert.strictEqual(isCpuModel('LiquidAI/lfm2.5-1.2b-instruct:latest'), true);
    assert.strictEqual(isCpuModel('lfm'), true);
    assert.strictEqual(isCpuModel('nemotron-3-nano:latest'), false);
    assert.strictEqual(isCpuModel('qwen2.5-coder:1.5b'), false);
  });

  await t.test('getCpuModels contains LFM2.5', () => {
    const cpuModels = getCpuModels();
    const lfm = cpuModels.find(m => m.model_id === 'lfm2.5-1.2b-instruct');
    assert.ok(lfm, 'CPU models list must contain LFM2.5');
    assert.strictEqual(lfm.execution_target, 'CPU');
  });
});
