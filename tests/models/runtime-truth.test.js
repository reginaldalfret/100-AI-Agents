import test from 'node:test';
import assert from 'node:assert/strict';
import { getModelById, isCpuModel } from '../../platform/models/model-registry.js';

test('Runtime Truth — Hardware Targets and VRAM Zero Assertions', () => {
  const lfm = getModelById('lfm2.5-350m');
  assert.equal(lfm.vram_mb, 0, 'LFM2.5 350M must consume 0 VRAM');
  assert.equal(lfm.execution_target, 'CPU');
  assert.equal(lfm.runtime_type, 'OLLAMA');

  const rwkv = getModelById('rwkv7-0.4b');
  assert.equal(rwkv.vram_mb, 0, 'RWKV-7 0.4B must consume 0 VRAM');
  assert.equal(rwkv.execution_target, 'CPU');
  assert.equal(rwkv.runtime_type, 'OLLAMA');

  assert.ok(isCpuModel('lfm2.5-350m'), 'isCpuModel must return true for LFM');
  assert.ok(isCpuModel('rwkv7-0.4b'), 'isCpuModel must return true for RWKV');
});
