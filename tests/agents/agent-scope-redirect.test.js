/**
 * Test Suite: Agent Scope Redirection & One-Click Specialist Agent Switching
 * 
 * Verifies that specialist agents detect out-of-scope requests before model execution,
 * generate warm, polite, and respectful messages without harsh words,
 * recommend the precise specialist agent with canonical ID and display numbers,
 * and provide structured contracts for one-click UI switching with prompt preservation.
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { agentScopeGuard } from '../../platform/intelligence/agent-scope-guard.js';

// HARSH PHRASES THAT MUST NEVER APPEAR IN OUT-OF-SCOPE MESSAGES
const FORBIDDEN_HARSH_PHRASES = [
  'wrong agent',
  'you selected the wrong agent',
  'cannot',
  "can't do that",
  'not my job',
  'invalid request',
  'rejected',
  'error',
  'unsupported'
];

function assertPoliteLanguage(message) {
  assert.ok(message, 'Polite message must be present');
  const lower = message.toLowerCase();
  for (const phrase of FORBIDDEN_HARSH_PHRASES) {
    assert.ok(!lower.includes(phrase), `Message must NEVER contain harsh phrase "${phrase}". Found in: "${message}"`);
  }
  // Must use polite phrases
  const hasPolitePhrase = lower.includes('outside my specialization') ||
                          lower.includes('better handled by') ||
                          lower.includes('specialized in');
  assert.ok(hasPolitePhrase, `Message must use polite phrasing like "outside my specialization" or "better handled by". Found: "${message}"`);
}

test('CASE A: 004 Quiz AI Agent asked to "write a email for internship"', () => {
  const agent = { agent_id: 'agent-004', name: 'Quiz AI Agent', category: 'Education & Learning' };
  const task = 'write a email for internship';

  const decision = agentScopeGuard.checkScope(agent, task);

  assert.strictEqual(decision.inScope, false, 'Email task must be out-of-scope for Quiz Agent');
  assert.strictEqual(decision.status, 'out_of_scope');
  assert.strictEqual(decision.currentAgentId, '004');
  assert.strictEqual(decision.recommendedAgentId, '002');
  assert.strictEqual(decision.recommendedAgentName, 'Email AI Agent');
  assert.strictEqual(decision.originalPrompt, task);

  assertPoliteLanguage(decision.politeMessage);
  assert.ok(decision.politeMessage.includes('Email AI Agent'), 'Must recommend Email AI Agent by name');
});

test('CASE B: 004 Quiz AI Agent asked to "create 10 MCQs about Python"', () => {
  const agent = { agent_id: 'agent-004', name: 'Quiz AI Agent', category: 'Education & Learning' };
  const task = 'create 10 MCQs about Python';

  const decision = agentScopeGuard.checkScope(agent, task);

  assert.strictEqual(decision.inScope, true, 'Creating MCQs must be in-scope for Quiz Agent');
  assert.strictEqual(decision.detectedDomain, 'quiz-assessment');
});

test('CASE C: 002 Email AI Agent asked to "draft an email to HR asking about internship"', () => {
  const agent = { agent_id: 'agent-002', name: 'Email AI Agent', category: 'Writing & Communication' };
  const task = 'draft an email to HR asking about internship';

  const decision = agentScopeGuard.checkScope(agent, task);

  assert.strictEqual(decision.inScope, true, 'Drafting an email must be in-scope for Email Agent');
  assert.strictEqual(decision.detectedDomain, 'email-communication');
});

test('CASE D: 002 Email AI Agent asked to "create a quiz about Python"', () => {
  const agent = { agent_id: 'agent-002', name: 'Email AI Agent', category: 'Writing & Communication' };
  const task = 'create a quiz about Python';

  const decision = agentScopeGuard.checkScope(agent, task);

  assert.strictEqual(decision.inScope, false, 'Quiz generation must be out-of-scope for Email Agent');
  assert.strictEqual(decision.status, 'out_of_scope');
  assert.strictEqual(decision.currentAgentId, '002');
  assert.strictEqual(decision.recommendedAgentId, '004');
  assert.strictEqual(decision.recommendedAgentName, 'Quiz AI Agent');
  assert.strictEqual(decision.originalPrompt, task);

  assertPoliteLanguage(decision.politeMessage);
  assert.ok(decision.politeMessage.includes('Quiz AI Agent'), 'Must recommend Quiz AI Agent by name');
});

test('CASE E: 004 Quiz AI Agent asked to "build a REST API in Node.js"', () => {
  const agent = { agent_id: 'agent-004', name: 'Quiz AI Agent', category: 'Education & Learning' };
  const task = 'build a REST API in Node.js';

  const decision = agentScopeGuard.checkScope(agent, task);

  assert.strictEqual(decision.inScope, false, 'Backend development must be out-of-scope for Quiz Agent');
  assert.strictEqual(decision.status, 'out_of_scope');
  assert.strictEqual(decision.recommendedAgentId, '061');
  assert.strictEqual(decision.recommendedAgentName, 'Code Generation AI Agent');

  assertPoliteLanguage(decision.politeMessage);
});

test('CASE F: 101 Super AI Agent asked for cross-domain task', () => {
  const agent = { agent_id: 'agent-101', name: 'Super AI Agent', category: 'Master Orchestration' };
  const task = 'read my resume and write a personalized internship email';

  const decision = agentScopeGuard.checkScope(agent, task);

  assert.strictEqual(decision.inScope, true, 'Super AI Agent 101 must ALWAYS be in-scope for cross-domain orchestration');
  assert.strictEqual(decision.isMasterOrchestrator, true);
});

test('7. Intent-Aware Educational Explanation — "Explain Docker for my exam"', () => {
  const agent = { agent_id: 'agent-003', name: 'Study AI Agent', category: 'Education & Learning' };
  const task = 'Explain Docker for my exam.';

  const decision = agentScopeGuard.checkScope(agent, task);

  assert.strictEqual(decision.inScope, true, 'Explaining concepts for an exam must be in-scope for Study Agent');
});

test('8. Intent-Aware Writing Intent — "Write an article about Kubernetes"', () => {
  const agent = { agent_id: 'agent-001', name: 'Writing AI Agent', category: 'Writing & Communication' };
  const task = 'Write an article about Kubernetes and cloud architecture.';

  const decision = agentScopeGuard.checkScope(agent, task);

  assert.strictEqual(decision.inScope, true, 'Writing an article must be in-scope for Writing Agent');
});

test('9. Writing Agent asked to "Deploy this Docker container to AWS"', () => {
  const agent = { agent_id: 'agent-001', name: 'Writing AI Agent', category: 'Writing & Communication' };
  const task = 'Deploy this Docker container to AWS.';

  const decision = agentScopeGuard.checkScope(agent, task);

  assert.strictEqual(decision.inScope, false, 'DevOps deployment must be out-of-scope for Writing Agent');
  assert.strictEqual(decision.recommendedAgentId, '072');
  assert.strictEqual(decision.recommendedAgentName, 'DevOps AI Agent');
  assertPoliteLanguage(decision.politeMessage);
});

test('10. Image Analysis Agent asked for SQL migration', () => {
  const agent = { agent_id: 'agent-051', name: 'Image Analysis AI Agent', category: 'Vision & Multimodal' };
  const task = 'Write a SQL query to join orders and customers with foreign key index.';

  const decision = agentScopeGuard.checkScope(agent, task);

  assert.strictEqual(decision.inScope, false, 'Database queries must be out-of-scope for Image Agent');
  assert.strictEqual(decision.recommendedAgentId, '071');
  assert.strictEqual(decision.recommendedAgentName, 'Database AI Agent');
  assertPoliteLanguage(decision.politeMessage);
});
