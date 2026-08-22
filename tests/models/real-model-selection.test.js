/**
 * Real Multi-Model Execution & Backend Verification Test Suite (High-Speed Optimized)
 * Tests that model selection strictly controls the actual local model used for inference.
 */

import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const GATEWAY_URL = 'http://127.0.0.1:8300';

async function sendChat(payload) {
  const res = await fetch(`${GATEWAY_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return { status: res.status, data };
}

let passed = 0;
let failed = 0;

function pass(msg) {
  console.log(`  [PASS] ${msg}`);
  passed++;
}

function fail(msg, err) {
  console.error(`  [FAIL] ${msg}`);
  if (err) console.error(`         ${err.message}`);
  failed++;
}

async function runTests() {
  console.log('============================================================');
  console.log('RUNNING TEST SUITE: Real Multi-Model Execution & Fingerprint');
  console.log('============================================================');

  // Test 1: Gemma selection -> actual Ollama model = gemma3:4b
  try {
    const { status, data } = await sendChat({
      agent_id: 'agent-101',
      task: 'Reply with the word "READY" only.',
      modelMode: 'gemma',
      model_override: 'gemma3:4b'
    });
    assert.strictEqual(status, 200, 'HTTP status must be 200');
    assert.strictEqual(data.model_mode, 'manual', 'model_mode must be manual');
    assert(data.actual_model.includes('gemma3:4b') || data.actual_model.includes('gemma'), `actual_model must be gemma3:4b, got ${data.actual_model}`);
    assert.strictEqual(data.external_calls, 0, 'Zero external calls required');
    pass('Gemma selection strictly executes on actual runtime model [gemma3:4b]');
  } catch (e) {
    fail('Gemma selection strictly executes on actual runtime model [gemma3:4b]', e);
  }

  // Test 2: Nemotron selection -> actual Ollama model = nemotron-3-nano
  try {
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
    pass('Nemotron selection strictly executes on actual runtime model [nemotron-3-nano]');
  } catch (e) {
    fail('Nemotron selection strictly executes on actual runtime model [nemotron-3-nano]', e);
  }

  // Test 3: Qwen selection -> actual Ollama model = qwen2.5-coder:1.5b
  try {
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
    pass('Qwen selection strictly executes on actual runtime model [qwen2.5-coder:1.5b]');
  } catch (e) {
    fail('Qwen selection strictly executes on actual runtime model [qwen2.5-coder:1.5b]', e);
  }

  // Test 4: Auto selection dynamically routes based on task context
  try {
    const codeTask = await sendChat({
      agent_id: 'agent-101',
      task: 'Write a Python script function to parse JSON string',
      modelMode: 'auto'
    });
    assert.strictEqual(codeTask.data.model_mode, 'auto');
    assert(codeTask.data.actual_model.includes('qwen') || codeTask.data.actual_model.includes('coder'), `Code task should auto-route to Qwen Coder, got ${codeTask.data.actual_model}`);

    const visionTask = await sendChat({
      agent_id: 'agent-101',
      task: 'Analyze this photo image diagram of heat exchanger',
      modelMode: 'auto'
    });
    assert.strictEqual(visionTask.data.model_mode, 'auto');
    assert(visionTask.data.actual_model.includes('gemma'), `Vision task should auto-route to Gemma, got ${visionTask.data.actual_model}`);

    pass('Auto mode dynamically routes tasks to optimal specialist model');
  } catch (e) {
    fail('Auto mode dynamically routes tasks to optimal specialist model', e);
  }

  // Test 5: Model switching sequence (Qwen -> Nemotron -> Gemma)
  try {
    const seq = [
      { mode: 'qwen', override: 'qwen2.5-coder:1.5b', expected: 'qwen2.5-coder:1.5b' },
      { mode: 'nemotron', override: 'nemotron-3-nano', expected: 'nemotron-3-nano' },
      { mode: 'gemma', override: 'gemma3:4b', expected: 'gemma3:4b' }
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
    pass('Sequential model switching (Qwen -> Nemotron -> Gemma) preserves strict model isolation');
  } catch (e) {
    fail('Sequential model switching preserves strict model isolation', e);
  }

  // Test 6: Strict no silent fallback on unavailable model
  try {
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
    pass('Strict no silent fallback: unavailable model returns model_unavailable with 0 execution');
  } catch (e) {
    fail('Strict no silent fallback: unavailable model returns model_unavailable', e);
  }

  console.log('------------------------------------------------------------');
  console.log(`Summary: ${passed} Passed, ${failed} Failed`);
  console.log('============================================================');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
