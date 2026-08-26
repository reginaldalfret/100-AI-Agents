import test from 'node:test';
import assert from 'node:assert/strict';
import { isCpuModel, getModelById, getCpuModels, LOCAL_MODELS } from '../../platform/models/model-registry.js';

test('CPU-Only Model Isolation & Concurrency Verification', () => {
  const cpuList = getCpuModels();
  assert.equal(cpuList.length, 4, 'Exactly 4 active CPU LLMs must be configured');

  for (const m of cpuList) {
    assert.equal(m.vram_mb, 0, `${m.name} must have 0 MB VRAM footprint`);
    assert.ok(isCpuModel(m.model_id), `${m.model_id} must be recognized as CPU model`);
  }
});
