import test from 'node:test';
import assert from 'node:assert/strict';
import { getModelById, isCpuModel } from '../../platform/models/model-registry.js';
import { runLocalModel } from '../../platform/models/model-streamer.js';

test('Stable LM 2 1.6B — CPU Registry & Real Inference', async (t) => {
  await t.test('Registration and CPU metadata validation', () => {
    const model = getModelById('stablelm2-1.6b');
    assert.ok(model, 'Stable LM 2 1.6B must be registered in LOCAL_MODELS');
    assert.strictEqual(model.ollama_name, 'stablelm2:1.6b');
    assert.strictEqual(model.execution_target, 'CPU');
    assert.strictEqual(model.vram_mb, 0, 'Must have 0 MB GPU VRAM');
    assert.strictEqual(model.runtime_type, 'OLLAMA');
    assert.strictEqual(model.badge, 'GENERAL');
    assert.strictEqual(model.endpoint_options?.num_gpu, 0, 'num_gpu must be strictly 0');
    assert.ok(isCpuModel('stablelm2-1.6b'));
    assert.ok(isCpuModel('stablelm2'));
  });

  await t.test('Real CPU-only inference execution', async () => {
    const res = await runLocalModel({
      model: 'stablelm2-1.6b',
      prompt: 'What is 2 + 2?'
    });

    assert.ok(res.text, 'Must return inference text');
    assert.strictEqual(res.execution_target, 'CPU');
    assert.strictEqual(res.external_calls, 0);
    assert.ok(res.text.includes('4'), 'Must correctly answer 4');
  });
});
