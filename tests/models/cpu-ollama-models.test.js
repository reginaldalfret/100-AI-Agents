import test from 'node:test';
import assert from 'node:assert/strict';
import { getCpuModels } from '../../platform/models/model-registry.js';

test('CPU Ollama Models Tier (4 Active CPU Models)', () => {
  const cpuModels = getCpuModels();
  assert.strictEqual(cpuModels.length, 4, 'Must have exactly 4 active CPU LLMs');

  const expectedIds = ['lfm2.5-350m', 'rwkv7-0.4b', 'tinyllama-1.1b', 'stablelm2-1.6b'];
  const ids = cpuModels.map(m => m.model_id);
  for (const expected of expectedIds) {
    assert.ok(ids.includes(expected), `Missing CPU model ${expected}`);
  }

  for (const m of cpuModels) {
    assert.strictEqual(m.execution_target, 'CPU');
    assert.strictEqual(m.vram_mb, 0);
    assert.strictEqual(m.runtime_type, 'OLLAMA');
    assert.deepStrictEqual(m.endpoint_options, { num_gpu: 0 });
  }
});
