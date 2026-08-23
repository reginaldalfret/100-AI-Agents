import test from 'node:test';
import assert from 'node:assert/strict';
import { SuperAIWorkflowEngine } from '../../platform/workflow-engine/super-ai-workflow-engine.js';

test('1. Real Execution Provenance: Workflow traces retain complete execution metadata', async () => {
  const engine = new SuperAIWorkflowEngine();
  const plan = engine.planWorkflow('Build an interactive dashboard in HTML, CSS, JavaScript');

  const result = await engine.executeWorkflow(plan, {
    executeAgentFn: async (contract) => ({
      code: contract.technology === 'HTML' ? '<div id="app"></div>' : (contract.technology === 'CSS' ? '#app { color: red; }' : 'console.log(1);'),
      model: 'qwen2.5-coder:1.5b',
      durationMs: 310,
      source: 'live_model'
    })
  });

  assert.equal(result.executionRecords.length, 3);
  for (const rec of result.executionRecords) {
    assert.ok(rec.workflowId, 'Must have workflowId');
    assert.ok(rec.subtaskId, 'Must have subtaskId');
    assert.ok(rec.agentId, 'Must have agentId');
    assert.ok(rec.displayNumber, 'Must have displayNumber');
    assert.ok(rec.startedAt, 'Must have startedAt');
    assert.ok(rec.completedAt, 'Must have completedAt');
    assert.ok(rec.durationMs > 0, 'Must have positive duration');
    assert.equal(rec.source, 'live_model');
  }
});
