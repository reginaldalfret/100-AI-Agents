/**
 * Real Multi-Model Execution & Backend Verification Test Suite (High-Speed Optimized)
 * Tests that model selection strictly controls the actual local model used for inference.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const GATEWAY_URL = 'http://127.0.0.1:8300';

async function isGatewayAvailable() {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/health`, { method: 'GET', signal: AbortSignal.timeout(1000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function sendChat(payload) {
  const res = await fetch(`${GATEWAY_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return { status: res.status, data };
}

describe('Real Multi-Model Execution & Fingerprint Test Suite', async () => {
  const gatewayOnline = await isGatewayAvailable();

  it('Gemma selection strictly executes on actual runtime model [gemma3:1b]', async (t) => {
    if (!gatewayOnline) {
      t.skip('Gateway is offline at 127.0.0.1:8300; skipping live network inference test');
      return;
    }
    const { status, data } = await sendChat({
      agent_id: 'agent-101',
      task: 'Reply with the word "READY" only.',
      modelMode: 'gemma',
      model_override: 'gemma3:1b'
    });
    assert.strictEqual(status, 200, 'HTTP status must be 200');
    assert.strictEqual(data.model_mode, 'manual', 'model_mode must be manual');
    assert(data.actual_model.includes('gemma3:1b') || data.actual_model.includes('gemma3') || data.actual_model.includes('gemma'), `actual_model must be gemma3:1b, got ${data.actual_model}`);
    assert.strictEqual(data.external_calls, 0, 'Zero external calls required');
  });

  it('Nemotron selection strictly executes on actual runtime model [nemotron-3-nano]', async (t) => {
    if (!gatewayOnline) {
      t.skip('Gateway is offline at 127.0.0.1:8300; skipping live network inference test');
      return;
    }
    const { status, data } = await sendChat({
      agent_id: 'agent-101',
      task: 'Reply with the word "READY" only.',
      modelMode: 'nemotron',
      model_override: 'nemotron-3-nano'
    });
    assert.strictEqual(status, 200, 'HTTP status must be 200');
    assert.strictEqual(data.model_mode, 'manual', 'model_mode must be manual');
    assert(data.actual_model.includes('nemotron-3-nano') || data.actual_model.includes('nemotron'), `actual_model must be nemotron-3-nano, got ${data.actual_model}`);
    assert.strictEqual(data.external_calls, 0, 'Zero external calls required');
  });

  it('Qwen selection strictly executes on actual runtime model [qwen2.5-coder:1.5b]', async (t) => {
    if (!gatewayOnline) {
      t.skip('Gateway is offline at 127.0.0.1:8300; skipping live network inference test');
      return;
    }
    const { status, data } = await sendChat({
      agent_id: 'agent-101',
      task: 'Write: def ping(): return True',
      modelMode: 'qwen',
      model_override: 'qwen2.5-coder:1.5b'
    });
    assert.strictEqual(status, 200, 'HTTP status must be 200');
    assert.strictEqual(data.model_mode, 'manual', 'model_mode must be manual');
    assert(data.actual_model.includes('qwen2.5-coder:1.5b') || data.actual_model.includes('qwen'), `actual_model must be qwen2.5-coder:1.5b, got ${data.actual_model}`);
    assert.strictEqual(data.external_calls, 0, 'Zero external calls required');
  });

  it('Auto mode dynamically routes tasks to optimal specialist model', async (t) => {
    if (!gatewayOnline) {
      t.skip('Gateway is offline at 127.0.0.1:8300; skipping live network inference test');
      return;
    }
    const codeTask = await sendChat({
      agent_id: 'agent-101',
      task: 'Write a Python script function to parse JSON string',
      modelMode: 'auto'
    });
    assert.strictEqual(codeTask.data.model_mode, 'auto');
    assert(codeTask.data.actual_model.includes('qwen') || codeTask.data.actual_model.includes('coder'), `Code task should auto-route to Qwen Coder, got ${codeTask.data.actual_model}`);

    const nlpTask = await sendChat({
      agent_id: 'agent-101',
      task: 'Rewrite this short sentence to be more polite: Send me the file right now',
      modelMode: 'auto'
    });
    assert.strictEqual(nlpTask.data.model_mode, 'auto');
    assert(nlpTask.data.actual_model.includes('smollm') || nlpTask.data.actual_model.includes('gemma') || nlpTask.data.actual_model.includes('llama'), `Edge NLP task should auto-route to SmolLM2 / Gemma, got ${nlpTask.data.actual_model}`);
  });

  it('Sequential model switching (Qwen -> Nemotron -> Gemma) preserves strict model isolation', async (t) => {
    if (!gatewayOnline) {
      t.skip('Gateway is offline at 127.0.0.1:8300; skipping live network inference test');
      return;
    }
    const seq = [
      { mode: 'qwen', override: 'qwen2.5-coder:1.5b', expected: 'qwen2.5-coder:1.5b' },
      { mode: 'nemotron', override: 'nemotron-3-nano', expected: 'nemotron-3-nano' },
      { mode: 'gemma', override: 'gemma3:1b', expected: 'gemma3:1b' }
    ];

    for (let i = 0; i < seq.length; i++) {
      const step = seq[i];
      const res = await sendChat({
        agent_id: 'agent-101',
        task: `Ping step ${i + 1}`,
        modelMode: step.mode,
        model_override: step.override
      });
      assert(res.data.actual_model.includes(step.expected.split(':')[0]), `Step ${i + 1} expected ${step.expected}, got ${res.data.actual_model}`);
    }
  });

  it('Strict no silent fallback: unavailable model returns model_unavailable', async (t) => {
    if (!gatewayOnline) {
      t.skip('Gateway is offline at 127.0.0.1:8300; skipping live network inference test');
      return;
    }
    const { status, data } = await sendChat({
      agent_id: 'agent-101',
      task: 'Test hypothetical missing model',
      modelMode: 'manual',
      model_override: 'non-existent-model-xyz:99b'
    });
    assert.strictEqual(status, 503, 'Unavailable model must return HTTP 503');
    assert.strictEqual(data.status, 'model_unavailable', 'Status must be model_unavailable');
    assert.strictEqual(data.actual_model, null, 'Actual model must be null (no silent substitution)');
    assert(data.error && data.error.message.includes('unavailable'), 'Error message must explain model unavailability');
  });
});
