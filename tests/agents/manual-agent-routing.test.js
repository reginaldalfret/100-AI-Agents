import test from 'node:test';
import assert from 'node:assert/strict';
import { orchestratorController } from '../../platform/orchestrator/orchestrator-controller.js';

test('Manual Agent Routing in Orchestrator', async (t) => {
  await t.test('Explicit manual agentId = opencode sets selectionType to MANUAL', async () => {
    const result = await orchestratorController.processRequest('write a python script', {
      agentId: 'opencode'
    });

    assert.equal(result.selectedAgent, 'opencode');
    assert.equal(result.routingTrace.selectionType, 'MANUAL');
    assert.ok(result.routingTrace.selectionReason.includes('opencode'));
    assert.equal(result.routingTrace.external_calls, 0);
    assert.equal(result.routingTrace.network_mode, 'LOCAL_ONLY');
  });

  await t.test('Explicit manual agentId = hermes sets selectionType to MANUAL', async () => {
    const result = await orchestratorController.processRequest('plan this investigation', {
      agentId: 'hermes'
    });

    assert.equal(result.selectedAgent, 'hermes');
    assert.equal(result.routingTrace.selectionType, 'MANUAL');
    assert.equal(result.routingTrace.external_calls, 0);
  });
});
