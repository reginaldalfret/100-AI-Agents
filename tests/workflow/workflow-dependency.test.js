import { test } from 'node:test';
import assert from 'node:assert';
import { SuperAIWorkflowEngine } from '../../platform/workflow-engine/super-ai-workflow-engine.js';

test('5. Dependency Execution: Executes HTML before dependent CSS and JS', async () => {
  const engine = new SuperAIWorkflowEngine();
  const plan = engine.planWorkflow('Design an E-Commerce website in HTML, CSS, JavaScript.');
  
  const executionOrder = [];
  const result = await engine.executeWorkflow(plan, {
    executeAgentFn: async (contract) => {
      executionOrder.push(contract.technology);
      return {
        code: `// Code for ${contract.technology}`,
        model: 'qwen2.5-coder:1.5b'
      };
    }
  });
  
  assert.strictEqual(result.status, 'COMPLETED');
  assert.strictEqual(executionOrder[0], 'HTML');
  assert.ok(executionOrder.slice(1).includes('CSS'));
  assert.ok(executionOrder.slice(1).includes('JavaScript'));
});