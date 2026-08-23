import test from 'node:test';
import assert from 'node:assert/strict';
import { SuperAIWorkflowEngine } from '../../platform/workflow-engine/super-ai-workflow-engine.js';

test('1. Real Agent Execution: Multi-language programming executes actual specialist subtasks', async () => {
  const engine = new SuperAIWorkflowEngine();
  const plan = engine.planWorkflow('Write a palindrome program in C++, Java, Python');

  assert.equal(plan.workflowType, 'PARALLEL');
  assert.equal(plan.subtasks.length, 3);

  const result = await engine.executeWorkflow(plan);

  assert.equal(result.status, 'COMPLETED');
  assert.equal(Object.keys(result.subtaskResults).length, 3);

  // Verify all 3 specialists completed with actual non-empty code
  const cpp = Object.values(result.subtaskResults).find(s => s.technology === 'C++');
  const java = Object.values(result.subtaskResults).find(s => s.technology === 'Java');
  const python = Object.values(result.subtaskResults).find(s => s.technology === 'Python');

  assert.ok(cpp, 'C++ subtask exists');
  assert.ok(java, 'Java subtask exists');
  assert.ok(python, 'Python subtask exists');

  assert.ok(cpp.result.code.includes('isPalindrome') || cpp.result.code.includes('#include'));
  assert.ok(java.result.code.includes('class') || java.result.code.includes('isPalindrome'));
  assert.ok(python.result.code.includes('def is_palindrome') || python.result.code.includes('def '));
});
