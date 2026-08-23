import { test } from 'node:test';
import assert from 'node:assert';
import { SuperAIWorkflowEngine } from '../../platform/workflow-engine/super-ai-workflow-engine.js';

test('1. Workflow Planning: Converts multi-language prompt into structured plan', () => {
  const engine = new SuperAIWorkflowEngine();
  const plan = engine.planWorkflow('Write a palindrome program in C++, Java, and Python.');
  
  assert.ok(plan.workflowId.startsWith('wf-'));
  assert.ok(plan.rootAgent === 'agent-301' || plan.rootAgent === 'agent-101');
  assert.strictEqual(plan.workflowType, 'PARALLEL');
  assert.strictEqual(plan.subtasks.length, 3);
  
  const techs = plan.subtasks.map(s => s.technology);
  assert.ok(techs.includes('C++'));
  assert.ok(techs.includes('Java'));
  assert.ok(techs.includes('Python'));
});