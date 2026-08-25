import test from 'node:test';
import assert from 'node:assert/strict';
import { getCpuModels, isCpuModel, getGpuModels, LOCAL_MODELS } from '../../platform/models/model-registry.js';

test('CPU Model Registry & Canonical Inventory', async (t) => {
  await t.test('getCpuModels() returns all 5 active CPU models', () => {
    const cpuModels = getCpuModels();
    assert.strictEqual(cpuModels.length, 5, 'Active CPU models tier must contain exactly 5 models');

    const expectedIds = ['lfm2.5-350m', 'rwkv7-0.4b', 'mobilellm-pro-1b', 'mobilellm-350m', 'openelm-450m'];
    expectedIds.forEach(id => {
      const found = cpuModels.find(m => m.model_id === id);
      assert.ok(found, `Model ${id} must be in CPU models list`);
      assert.strictEqual(found.execution_target, 'CPU');
      assert.strictEqual(found.vram_mb, 0);
    });
  });

  await t.test('isCpuModel correctly classifies all 5 CPU models and rejects GPU models', () => {
    assert.strictEqual(isCpuModel('lfm2.5-350m'), true);
    assert.strictEqual(isCpuModel('rwkv7-0.4b'), true);
    assert.strictEqual(isCpuModel('mobilellm-pro-1b'), true);
    assert.strictEqual(isCpuModel('mobilellm-350m'), true);
    assert.strictEqual(isCpuModel('openelm-450m'), true);

    assert.strictEqual(isCpuModel('nemotron-3-nano'), false);
    assert.strictEqual(isCpuModel('qwen2.5-coder:1.5b'), false);
    assert.strictEqual(isCpuModel('gemma3:1b'), false);
    assert.strictEqual(isCpuModel('llama3.2:1b'), false);
    assert.strictEqual(isCpuModel('granite4:1b-h'), false);
    assert.strictEqual(isCpuModel('phi4-mini'), false);
    assert.strictEqual(isCpuModel('smollm2:1.7b'), false);
  });
});
