import { test } from 'node:test';
import assert from 'node:assert';
import { SuperAIWorkflowEngine } from '../../platform/workflow-engine/super-ai-workflow-engine.js';

test('8. Subtask Retry: Retries a specific failed subtask cleanly', async () => {
  const engine = new SuperAIWorkflowEngine();
  const plan = engine.planWorkflow('Write a palindrome program in C++, Java, Python.');
  
  const wf = await engine.executeWorkflow(plan, {
    executeAgentFn: async (contract) => {
      if (contract.technology === 'Java') throw new Error('First attempt failed');
      return { code: 'ok', model: 'qwen2.5-coder:1.5b' };
    }
  });
  
  assert.strictEqual(wf.status, 'PARTIAL');
  
  const retryWf = await engine.retrySubtask(wf.workflowId, 'subtask-2-java');
  assert.strictEqual(retryWf.status, 'COMPLETED');
  assert.strictEqual(retryWf.subtaskResults['subtask-2-java']?.status, 'completed');
});