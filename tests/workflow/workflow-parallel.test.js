import { test } from 'node:test';
import assert from 'node:assert';
import { SuperAIWorkflowEngine } from '../../platform/workflow-engine/super-ai-workflow-engine.js';

test('4. Parallel Execution: Executes independent multi-language subtasks', async () => {
  const engine = new SuperAIWorkflowEngine();
  const plan = engine.planWorkflow('Write a palindrome program in C++, Java, Python.');
  
  const result = await engine.executeWorkflow(plan);
  
  assert.strictEqual(result.status, 'COMPLETED');
  assert.strictEqual(Object.keys(result.subtaskResults).length, 3);
  assert.ok(result.finalSynthesis.includes('C++'));
  assert.ok(result.finalSynthesis.includes('Java'));
  assert.ok(result.finalSynthesis.includes('Python'));
  assert.strictEqual(result.artifacts.length, 3);
});