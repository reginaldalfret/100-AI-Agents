import { test } from 'node:test';
import assert from 'node:assert';
import { SuperAIWorkflowEngine } from '../../platform/workflow-engine/super-ai-workflow-engine.js';

test('7. Partial Failure Resilience: Independent subtasks succeed when one specialist fails', async () => {
  const engine = new SuperAIWorkflowEngine();
  const plan = engine.planWorkflow('Write a palindrome program in C++, Java, Python.');
  
  const result = await engine.executeWorkflow(plan, {
    executeAgentFn: async (contract) => {
      if (contract.technology === 'Java') {
        throw new Error('Simulated Java specialist compilation timeout');
      }
      return { code: `// ${contract.technology} code`, model: 'qwen2.5-coder:1.5b' };
    }
  });
  
  assert.strictEqual(result.status, 'PARTIAL');
  assert.strictEqual(result.subtaskResults['subtask-1-cpp']?.status, 'completed');
  assert.strictEqual(result.subtaskResults['subtask-2-java']?.status, 'failed');
  assert.strictEqual(result.subtaskResults['subtask-3-python']?.status, 'completed');
  assert.ok(result.finalSynthesis.includes('C++'));
  assert.ok(result.finalSynthesis.includes('Python'));
});