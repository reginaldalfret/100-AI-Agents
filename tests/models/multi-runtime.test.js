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

  await t.test('runLocalModel dispatches to ExecuTorch runtime for MobileLLM-Pro', async () => {
    const result = await runLocalModel({
      model: 'mobilellm-pro-1b',
      prompt: 'Draft an agenda for the weekly sync.'
    });
    assert.ok(result.text, 'Must return inference text');
    assert.strictEqual(result.execution_target, 'CPU');
    assert.strictEqual(result.runtime_type, RuntimeType.EXECUTORCH);
  });

  await t.test('runLocalModel dispatches to PyTorch runtime for OpenELM 450M', async () => {
    const result = await runLocalModel({
      model: 'openelm-450m',
      prompt: 'Summarize the report.'
    });
    assert.ok(result.text, 'Must return inference text');
    assert.strictEqual(result.execution_target, 'CPU');
    assert.strictEqual(result.runtime_type, RuntimeType.PYTORCH);
  });
});
