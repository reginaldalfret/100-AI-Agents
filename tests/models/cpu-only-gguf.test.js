import test from 'node:test';
import assert from 'node:assert/strict';
import { getCpuModels } from '../../platform/models/model-registry.js';

test('CPU-Only GGUF Hardware Isolation (Zero VRAM)', () => {
  const cpuModels = getCpuModels();
  assert.strictEqual(cpuModels.length, 4, 'Exactly 4 CPU text models must be registered');

  for (const m of cpuModels) {
    assert.strictEqual(m.vram_mb, 0, `${m.name} must have 0 VRAM`);
    assert.strictEqual(m.execution_target, 'CPU');
    assert.strictEqual(m.runtime_type, 'OLLAMA');
    assert.deepStrictEqual(m.endpoint_options, { num_gpu: 0 });
  }
});
