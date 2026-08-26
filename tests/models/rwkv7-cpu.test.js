import test from 'node:test';
import assert from 'node:assert/strict';
import { LOCAL_MODELS, getModelById, isCpuModel, getCpuModels } from '../../platform/models/model-registry.js';

test('RWKV-7 0.4B Model Registry and CPU Tiering', async (t) => {
  await t.test('RWKV-7 0.4B is registered with execution_target: CPU', () => {
    const rwkv = getModelById('rwkv7-0.4b');
    assert.ok(rwkv, 'RWKV-7 0.4B model should be registered');
    assert.strictEqual(rwkv.execution_target, 'CPU', 'RWKV-7 must have execution_target CPU');
    assert.strictEqual(rwkv.provider, 'RWKV');
    assert.strictEqual(rwkv.quantization, 'Q8_0');
    assert.strictEqual(rwkv.vram_mb, 0, 'RWKV-7 must allocate 0 MB VRAM');
    assert.strictEqual(rwkv.endpoint_options?.num_gpu, 0, 'num_gpu must be strictly 0');
  });

  await t.test('isCpuModel correctly identifies RWKV-7 and aliases', () => {
    assert.strictEqual(isCpuModel('rwkv7-0.4b'), true);
    assert.strictEqual(isCpuModel('mollysama/rwkv-7-g1d:0.4b'), true);
    assert.strictEqual(isCpuModel('rwkv'), true);
    assert.strictEqual(isCpuModel('rwkv7'), true);
    assert.strictEqual(isCpuModel('nemotron-3-nano:latest'), false);
    assert.strictEqual(isCpuModel('qwen2.5-coder:1.5b'), false);
  });

  await t.test('getCpuModels contains RWKV-7 0.4B and LFM2.5 350M', () => {
    const cpuModels = getCpuModels();
    assert.strictEqual(cpuModels.length, 4, 'CPU models tier must contain 4 active models');
    const rwkv = cpuModels.find(m => m.model_id === 'rwkv7-0.4b');
    const lfm = cpuModels.find(m => m.model_id === 'lfm2.5-350m');
    assert.ok(rwkv, 'CPU models list must contain RWKV-7');
    assert.ok(lfm, 'CPU models list must contain LFM2.5');
  });
});
