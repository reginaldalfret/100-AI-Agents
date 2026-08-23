import test from 'node:test';
import assert from 'node:assert/strict';
import { SuperAIWorkflowEngine } from '../../platform/workflow-engine/super-ai-workflow-engine.js';

test('1. Prompt Variation: Engine reflects specific prompt directives in specialist handoff contracts', async () => {
  const engine = new SuperAIWorkflowEngine();
  
  const plan1 = engine.planWorkflow('Write a palindrome program in C++, Java, Python');
  const plan2 = engine.planWorkflow('Write a palindrome program in C++, Java, Python with detailed docstrings and Unicode handling');

  assert.notEqual(plan1.originalRequest, plan2.originalRequest);
  assert.ok(plan2.subtasks[0].objective.includes('Unicode handling'));

  const capturedObjectives = [];
  await engine.executeWorkflow(plan2, {
    executeAgentFn: async (contract) => {
      capturedObjectives.push(contract.objective);
      return {
        code: '// ' + contract.objective,
        model: 'qwen2.5-coder:1.5b',
        durationMs: 150,
        source: 'live_model'
      };
    }
  });

  assert.equal(capturedObjectives.length, 3);
  assert.ok(capturedObjectives[0].includes('Unicode handling'), 'Specialist contract must receive exact prompt instruction');
});
