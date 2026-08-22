/**
 * Test Suite: Agent Scope Guard & Polite Domain Boundary Enforcement
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { agentScopeGuard } from '../../platform/intelligence/agent-scope-guard.js';

test('1. Specialist Out-Of-Scope Detection — Study Agent asked for Node.js REST API', () => {
  const agent = { agent_id: 'agent-003', name: 'Study AI Agent', category: 'Education & Learning' };
  const task = 'Write a REST API handler in Node.js.';

  const decision = agentScopeGuard.checkScope(agent, task);

  assert.strictEqual(decision.inScope, false, 'Node.js REST API must be detected as out-of-scope for Study Agent');
  assert.ok(decision.recommendedAgents.length >= 1, 'Must recommend at least 1 specialist');
  
  const recIds = decision.recommendedAgents.map(r => r.id);
  assert.ok(recIds.includes('agent-046') || recIds.includes('agent-033'), 'Must recommend Backend or JavaScript AI Agent');

  // Verify Polite Language & Zero Harsh Phrases
  const msg = decision.politeMessage.toLowerCase();
  assert.ok(!msg.includes('not my job'), 'Must not say "not my job"');
  assert.ok(!msg.includes('cannot'), 'Must not say "cannot"');
  assert.ok(!msg.includes('wrong agent'), 'Must not say "wrong agent"');
  assert.ok(!msg.includes('rejected'), 'Must not say "rejected"');
  assert.ok(!msg.includes('unsupported'), 'Must not say "unsupported"');
  assert.ok(decision.politeMessage.includes('046'), 'Must recommend Agent 046 Backend AI Agent');
});

test('2. Intent-Aware In-Scope Check — Study Agent asked to "Explain Docker for my exam"', () => {
  const agent = { agent_id: 'agent-003', name: 'Study AI Agent', category: 'Education & Learning' };
  const task = 'Explain Docker for my exam.';

  const decision = agentScopeGuard.checkScope(agent, task);

  assert.strictEqual(decision.inScope, true, 'Explaining concepts for an exam must be IN-SCOPE for Study Agent');
});

test('3. Intent-Aware In-Scope Check — Writing Agent asked to "Write an article about Kubernetes"', () => {
  const agent = { agent_id: 'agent-001', name: 'Writing AI Agent', category: 'Communication' };
  const task = 'Write an article about Kubernetes and cloud infrastructure.';

  const decision = agentScopeGuard.checkScope(agent, task);

  assert.strictEqual(decision.inScope, true, 'Writing an article must be IN-SCOPE for Writing Agent');
});

test('4. Specialist Out-Of-Scope Detection — Writing Agent asked to "Deploy this Docker container to AWS"', () => {
  const agent = { agent_id: 'agent-001', name: 'Writing AI Agent', category: 'Communication' };
  const task = 'Deploy this Docker container to AWS.';

  const decision = agentScopeGuard.checkScope(agent, task);

  assert.strictEqual(decision.inScope, false, 'DevOps deployment is out of scope for Writing Agent');
  const recIds = decision.recommendedAgents.map(r => r.id);
  assert.ok(recIds.includes('agent-015'), 'Must recommend DevOps AI Agent');
});

test('5. Specialist Out-Of-Scope Detection — Image Analysis Agent asked for SQL migration', () => {
  const agent = { agent_id: 'agent-066', name: 'Image Analysis AI Agent', category: 'Vision' };
  const task = 'Write a SQL query to join user accounts and transactions.';

  const decision = agentScopeGuard.checkScope(agent, task);

  assert.strictEqual(decision.inScope, false, 'SQL query is out of scope for Image Analysis Agent');
  const recIds = decision.recommendedAgents.map(r => r.id);
  assert.ok(recIds.includes('agent-031') || recIds.includes('agent-011'), 'Must recommend SQL or Database AI Agent');
});

test('6. Super AI Agent 101 Master Orchestrator is ALWAYS In-Scope', () => {
  const agent = { agent_id: 'agent-101', name: 'Super AI Agent', category: 'Master Orchestrator' };
  const task = 'Build a full-stack app with authentication, PostgreSQL, Docker, testing, and documentation.';

  const decision = agentScopeGuard.checkScope(agent, task);

  assert.strictEqual(decision.inScope, true, 'Super AI Agent must never be blocked by specialist domain boundaries');
  assert.strictEqual(decision.isMasterOrchestrator, true);
});
