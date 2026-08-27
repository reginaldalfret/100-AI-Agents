import test from 'node:test';
import assert from 'node:assert/strict';
import { orchestratorController } from '../../platform/orchestrator/orchestrator-controller.js';

test('Auto Agent Routing (301 Orchestrator Default)', async (t) => {
  await t.test('Auto mode classifies intent and routes to 301 specialists', async () => {
    const result = await orchestratorController.processRequest('calculate matrix multiplication', {
      agentId: 'auto'
    });

    assert.equal(result.intent, 'MATH');
    assert.equal(result.routingTrace.selectionType, 'AUTO');
    assert.ok(result.routingTrace.selectionReason.includes('Autonomous'));
    assert.equal(result.routingTrace.external_calls, 0);
    assert.equal(result.routingTrace.network_mode, 'LOCAL_ONLY');
  });

  await t.test('Auto mode for coding task selects specialized coding model', async () => {
    const result = await orchestratorController.processRequest('fix syntax bug in server.js', {});
    assert.equal(result.intent, 'CODING');
    assert.equal(result.selectedModel, 'local-code-specialist');
  });
});
