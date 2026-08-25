import test from 'node:test';
import assert from 'node:assert/strict';
import { LOCAL_MODELS, getModelById, isCpuModel, getCpuModels } from '../../platform/models/model-registry.js';

test('LFM2.5 350M Model Registry and CPU Tiering', async (t) => {
  await t.test('Liquid AI LFM2.5 350M is registered with execution_target: CPU', () => {
    const lfm = getModelById('lfm2.5-350m');
    assert.ok(lfm, 'LFM2.5 350M model should be registered');
    assert.strictEqual(lfm.execution_target, 'CPU', 'LFM2.5 350M must have execution_target CPU');
    assert.strictEqual(lfm.provider, 'Liquid AI');
    assert.strictEqual(lfm.quantization, 'Q8_0');
    assert.strictEqual(lfm.vram_mb, 0, 'LFM2.5 350M must allocate 0 MB VRAM');
    assert.strictEqual(lfm.endpoint_options?.num_gpu, 0, 'num_gpu must be strictly 0');
  });

  await t.test('isCpuModel correctly identifies LFM2.5 350M and aliases', () => {
    assert.strictEqual(isCpuModel('lfm2.5-350m'), true);
    assert.strictEqual(isCpuModel('LiquidAI/lfm2.5-350m'), true);
    assert.strictEqual(isCpuModel('LiquidAI/lfm2.5-350m:latest'), true);
    assert.strictEqual(isCpuModel('lfm'), true);
    assert.strictEqual(isCpuModel('nemotron-3-nano:latest'), false);
    assert.strictEqual(isCpuModel('qwen2.5-coder:1.5b'), false);
  });

  await t.test('getCpuModels contains LFM2.5 350M', () => {
    const cpuModels = getCpuModels();
    const lfm = cpuModels.find(m => m.model_id === 'lfm2.5-350m');
    assert.ok(lfm, 'CPU models list must contain LFM2.5 350M');
    assert.strictEqual(lfm.execution_target, 'CPU');
  });
});
