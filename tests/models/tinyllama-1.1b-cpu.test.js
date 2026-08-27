import test from 'node:test';
import assert from 'node:assert/strict';
import { getModelById, isCpuModel } from '../../platform/models/model-registry.js';
import { runLocalModel } from '../../platform/models/model-streamer.js';

test('TinyLlama 1.1B Chat — CPU Registry & Real Inference', async (t) => {
  await t.test('Registration and CPU metadata validation', () => {
    const model = getModelById('tinyllama-1.1b');
    assert.ok(model, 'TinyLlama 1.1B must be registered in LOCAL_MODELS');
    assert.strictEqual(model.ollama_name, 'tinyllama:1.1b-chat');
    assert.strictEqual(model.execution_target, 'CPU');
    assert.strictEqual(model.vram_mb, 0, 'Must have 0 MB GPU VRAM');
    assert.strictEqual(model.runtime_type, 'OLLAMA');
    assert.strictEqual(model.badge, 'GENERAL');
    assert.strictEqual(model.endpoint_options?.num_gpu, 0, 'num_gpu must be strictly 0');
    assert.ok(isCpuModel('tinyllama-1.1b'));
    assert.ok(isCpuModel('tinyllama:1.1b-chat'));
  });

  await t.test('Real CPU-only inference execution', async () => {
    const res = await runLocalModel({
      model: 'tinyllama-1.1b',
      prompt: 'What is 2 + 2?'
    });

    assert.ok(res.text, 'Must return inference text');
    assert.strictEqual(res.execution_target, 'CPU');
    assert.strictEqual(res.external_calls, 0);
    assert.ok(res.text.includes('4'), 'Must correctly answer 4');
  });
});
