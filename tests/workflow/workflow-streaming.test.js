import { test } from 'node:test';
import assert from 'node:assert';
import EventEmitter from 'events';
import { SuperAIWorkflowEngine } from '../../platform/workflow-engine/super-ai-workflow-engine.js';

test('13. Workflow Event Streaming: Emits structured event stream compatible with SSE', async () => {
  const engine = new SuperAIWorkflowEngine();
  const plan = engine.planWorkflow('Write a palindrome program in C++, Java, Python.');
  
  const sseEmitter = new EventEmitter();
  const sseFrames = [];
  
  sseEmitter.on('workflow_created', (d) => sseFrames.push({ event: 'workflow_created', d }));
  sseEmitter.on('agent_completed', (d) => sseFrames.push({ event: 'agent_completed', d }));
  sseEmitter.on('workflow_completed', (d) => sseFrames.push({ event: 'workflow_completed', d }));
  
  await engine.executeWorkflow(plan, {}, sseEmitter);
  
  assert.ok(sseFrames.some(f => f.event === 'workflow_created'));
  assert.ok(sseFrames.some(f => f.event === 'agent_completed' && (f.d.agentId === 'agent-113' || f.d.agentId === 'agent-057' || f.d.agentName.includes('C++'))));
  assert.ok(sseFrames.some(f => f.event === 'workflow_completed'));
});