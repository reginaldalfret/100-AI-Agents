import { test } from 'node:test';
import assert from 'node:assert';
import { SuperAIWorkflowEngine } from '../../platform/workflow-engine/super-ai-workflow-engine.js';

test('2. Workflow Decomposition: Classifies single-agent vs parallel vs dependency graph', () => {
  const engine = new SuperAIWorkflowEngine();
  
  const single = engine.planWorkflow('Write a Python palindrome program.');
  assert.strictEqual(single.workflowType, 'SINGLE_AGENT');
  assert.strictEqual(single.isFastPath, true);
  assert.strictEqual(single.subtasks.length, 1);
  
  const parallel = engine.planWorkflow('Write a palindrome program in C++, Java, Python.');
  assert.strictEqual(parallel.workflowType, 'PARALLEL');
  assert.strictEqual(parallel.subtasks.length, 3);
  
  const web = engine.planWorkflow('Design an E-Commerce website in HTML, CSS, JavaScript.');
  assert.strictEqual(web.workflowType, 'DEPENDENCY_GRAPH');
  assert.strictEqual(web.subtasks.length, 3);
  assert.deepStrictEqual(web.subtasks[0].dependencies, []);
  assert.deepStrictEqual(web.subtasks[1].dependencies, ['subtask-1-html']);
  assert.deepStrictEqual(web.subtasks[2].dependencies, ['subtask-1-html']);
});