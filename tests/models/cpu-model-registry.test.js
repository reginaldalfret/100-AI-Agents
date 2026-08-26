import test from 'node:test';
import assert from 'node:assert/strict';
import { getCpuModels, isCpuModel } from '../../platform/models/model-registry.js';

test('CPU Model Registry & Identification', () => {
  const cpuModels = getCpuModels();
  assert.strictEqual(cpuModels.length, 4, 'Must return 4 active CPU models');

  const modelIds = cpuModels.map(m => m.model_id);
  assert.ok(modelIds.includes('lfm2.5-350m'));
  assert.ok(modelIds.includes('rwkv7-0.4b'));
  assert.ok(modelIds.includes('tinyllama-1.1b'));
  assert.ok(modelIds.includes('stablelm2-1.6b'));
  assert.ok(isCpuModel('lfm2.5-350m'));
  assert.ok(isCpuModel('rwkv7-0.4b'));
  assert.ok(isCpuModel('tinyllama-1.1b'));
  assert.ok(isCpuModel('stablelm2-1.6b'));
});
