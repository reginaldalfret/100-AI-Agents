import { test } from 'node:test';
import assert from 'node:assert';
import { SuperAIWorkflowEngine } from '../../platform/workflow-engine/super-ai-workflow-engine.js';

test('11. Workflow Trace: Emits full lifecycle events for backend transparency', async () => {
  const engine = new SuperAIWorkflowEngine();
  const plan = engine.planWorkflow('Write a palindrome program in C++, Java, Python.');
  
  const events = [];
  engine.on('workflow_created', () => events.push('workflow_created'));
  engine.on('workflow_planned', () => events.push('workflow_planned'));
  engine.on('agent_dispatched', (e) => events.push(`dispatched:${e.technology}`));
  engine.on('agent_completed', (e) => events.push(`completed:${e.agentName}`));
  engine.on('workflow_synthesizing', () => events.push('workflow_synthesizing'));
  engine.on('workflow_completed', () => events.push('workflow_completed'));
  
  await engine.executeWorkflow(plan);
  
  assert.ok(events.includes('workflow_created'));
  assert.ok(events.includes('workflow_planned'));
  assert.ok(events.includes('dispatched:C++'));
  assert.ok(events.includes('dispatched:Java'));
  assert.ok(events.includes('dispatched:Python'));
  assert.ok(events.includes('workflow_synthesizing'));
  assert.ok(events.includes('workflow_completed'));
});