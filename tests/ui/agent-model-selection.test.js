import test from 'node:test';
import assert from 'node:assert/strict';
import { routeAgentToModel } from '../../platform/models/model-router.js';

test('Agent + Model Independent Selection Matrix', async (t) => {
  await t.test('OpenCode + Auto Model routes to specialized coding model', () => {
    const res = routeAgentToModel('opencode', 'CODING', { modelMode: 'auto' });
    assert.equal(res.model_id, 'local-code-specialist');
    assert.ok(res.reason.includes('OpenCode') || res.reason.includes('capability'));
  });

  await t.test('Hermes + Explicit Nemotron selection preserves manual model choice', () => {
    const res = routeAgentToModel('hermes', 'GENERAL_CHAT', { model_override: 'nemotron-3-nano:latest' });
    assert.equal(res.model_id, 'nemotron-3-nano');
  });

  await t.test('Pi + Auto Model routes to lightweight conversational model', () => {
    const res = routeAgentToModel('pi', 'GENERAL_CHAT', { modelMode: 'auto' });
    assert.equal(res.model_id, 'llama3.2-1b');
  });

  await t.test('Codex + CPU model override routes to CPU execution target', () => {
    const res = routeAgentToModel('codex', 'CODING', { model_override: 'LiquidAI/lfm2.5-350m' });
    assert.equal(res.model_id, 'lfm2.5-350m');
    assert.equal(res.execution_target, 'CPU');
  });
});
