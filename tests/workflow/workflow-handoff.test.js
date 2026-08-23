import { test } from 'node:test';
import assert from 'node:assert';
import { SuperAIWorkflowEngine } from '../../platform/workflow-engine/super-ai-workflow-engine.js';

test('6. Structured Handoff Contract: Verifies contract payload passed to specialist', async () => {
  const engine = new SuperAIWorkflowEngine();
  const plan = engine.planWorkflow('Write a palindrome program in C++, Java, Python.');
  
  let capturedContract = null;
  await engine.executeWorkflow(plan, {
    executeAgentFn: async (contract) => {
      if (!capturedContract) capturedContract = contract;
      return { code: 'test code', model: 'qwen2.5-coder:1.5b' };
    }
  });
  
  assert.ok(capturedContract);
  assert.ok(capturedContract.sourceAgent === 'agent-301' || capturedContract.sourceAgent === 'agent-101');
  assert.ok(capturedContract.workflowId);
  assert.ok(capturedContract.subtaskId);
  assert.ok(capturedContract.objective);
  assert.ok(capturedContract.expectedOutput);
});