import test from 'node:test';
import assert from 'node:assert/strict';
import { networkPolicy } from '../../platform/agents/network-policy.js';
import { orchestratorController } from '../../platform/orchestrator/orchestrator-controller.js';

test('Zero External Egress on Manual Agent Selection', async (t) => {
  await t.test('Policy is strictly LOCAL_ONLY by default', () => {
    assert.equal(networkPolicy.getPolicy(), 'LOCAL_ONLY');
    assert.equal(networkPolicy.isExternalAllowed(), false);
  });

  await t.test('External outbound egress is blocked with violation logged', () => {
    const egress = networkPolicy.validateEgressAttempt('https://api.openai.com/v1/chat/completions');
    assert.equal(egress.allowed, false);
    assert.ok(egress.reason.includes('LOCAL_ONLY'));
  });

  await t.test('Orchestrator processRequest guarantees external_calls: 0 on all manual routes', async () => {
    const agents = ['hermes', 'opencode', 'codex', 'openclaw', 'pi', 'copilot-cli'];
    for (const agent of agents) {
      const res = await orchestratorController.processRequest('analyze test file', { agentId: agent });
      assert.equal(res.routingTrace.external_calls, 0);
      assert.equal(res.routingTrace.network_mode, 'LOCAL_ONLY');
    }
  });
});
