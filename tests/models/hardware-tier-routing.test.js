import test from 'node:test';
import assert from 'node:assert/strict';
import { getGpuModels, getCpuModels } from '../../platform/models/model-registry.js';

test('Hardware Tiering & Capacity Partitioning', () => {
  const gpu = getGpuModels();
  const cpu = getCpuModels();

  assert.strictEqual(gpu.length, 9, 'Must have 9 active GPU models');
  assert.strictEqual(cpu.length, 4, 'Must have 4 active CPU models');

  for (const g of gpu) {
    assert.strictEqual(g.execution_target, 'GPU');
    assert.ok(g.vram_mb > 0);
  }

  for (const c of cpu) {
    assert.strictEqual(c.execution_target, 'CPU');
    assert.strictEqual(c.vram_mb, 0);
  }
});
