import test from 'node:test';
import assert from 'node:assert/strict';
import { RuntimeType, getModelById } from '../../platform/models/model-registry.js';
import { runLocalModel } from '../../platform/models/model-streamer.js';

test('Multi-Runtime Local Model Execution Interface', async (t) => {
  await t.test('RuntimeType defines all supported local CPU and GPU runtimes', () => {
    assert.strictEqual(RuntimeType.OLLAMA, 'OLLAMA');
    assert.strictEqual(RuntimeType.LLAMACPP, 'LLAMACPP');
    assert.strictEqual(RuntimeType.EXECUTORCH, 'EXECUTORCH');
    assert.strictEqual(RuntimeType.MLX, 'MLX');
    assert.strictEqual(RuntimeType.ONNXRUNTIME, 'ONNXRUNTIME');
    assert.strictEqual(RuntimeType.PYTORCH, 'PYTORCH');
  });
});
