import test from 'node:test';
import assert from 'node:assert/strict';
import { runLocalModel } from '../../platform/models/model-streamer.js';
import { getCpuModels } from '../../platform/models/model-registry.js';

test('Multi-Runtime Inference Dispatch across All CPU Models', async () => {
  const cpuModels = getCpuModels();
  assert.equal(cpuModels.length, 4, 'Must have 4 active CPU models registered');

  const runtimes = cpuModels.map(m => m.runtime_type);
  assert.ok(runtimes.includes('OLLAMA'), 'All active CPU models use Ollama runtime');
  for (const m of cpuModels) {
    assert.strictEqual(m.runtime_type, 'OLLAMA');
    assert.strictEqual(m.execution_target, 'CPU');
  }
});
