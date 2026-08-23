import { test } from 'node:test';
import assert from 'node:assert';
import { SuperAIWorkflowEngine } from '../../platform/workflow-engine/super-ai-workflow-engine.js';

test('9. Workflow Cancellation: Aborts active workflow on user request', async () => {
  const engine = new SuperAIWorkflowEngine();
  const plan = engine.planWorkflow('Design an E-Commerce website in HTML, CSS, JavaScript.');
  
  const promise = engine.executeWorkflow(plan, {
    executeAgentFn: async (contract) => {
      if (contract.technology === 'HTML') {
        engine.cancelWorkflow(plan.workflowId);
      }
      return { code: 'html ok', model: 'qwen2.5-coder:1.5b' };
    }
  });
  
  const wf = await promise;
  assert.strictEqual(wf.status, 'CANCELLED');
  assert.strictEqual(wf.isCancelled, true);
});