/**
 * Test Suite: Quality Preservation Across Performance Optimizations
 * Asserts reasoning, coding, conversational memory, and domain correctness under hardware safety.
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { conversationManager } from '../../../platform/context/index.js';
import { agentScopeGuard } from '../../../platform/intelligence/index.js';

test('1. Quality Preservation — Conversational Memory & Coreference Integrity', () => {
  const convId = `quality-test-${Date.now()}`;
  const agent = { agent_id: 'agent-001', name: 'Writing AI Agent' };

  // Turn 1
  const turn1User = 'Write a professional article about renewable energy.';
  const turn1Ai = 'Renewable energy includes solar, wind, hydro, and geothermal power sources.';
  conversationManager.appendMessage(convId, { role: 'user', content: turn1User });
  conversationManager.appendMessage(convId, { role: 'assistant', content: turn1Ai });
  conversationManager.recordTurn({
    conversationId: convId,
    userPrompt: turn1User,
    assistantResponse: turn1Ai,
    agent
  });

  // Turn 2
  const turn2Prep = conversationManager.prepareContext({
    conversationId: convId,
    agent,
    task: 'write about the types in it',
    model: 'nemotron-3-nano:latest'
  });

  assert.ok(turn2Prep.resolvedContext.resolvedReferences.length > 0, 'Must preserve reference resolution accuracy');
  assert.ok(turn2Prep.prompt.includes('renewable energy'), 'Prompt must retain resolved subject for quality synthesis');
});

test('2. Quality Preservation — Domain Boundary & Intent Distinction', () => {
  const studyAgent = { agent_id: 'agent-003', name: 'Study AI Agent', category: 'Education & Learning' };

  // 1. Study question on technical topic -> IN SCOPE
  const inScope = agentScopeGuard.checkScope(studyAgent, 'Explain Docker for my exam.');
  assert.strictEqual(inScope.inScope, true, 'Must preserve conceptual explanation accuracy for Study Agent');

  // 2. Production software execution on non-technical agent -> OUT OF SCOPE with polite guidance
  const outOfScope = agentScopeGuard.checkScope(studyAgent, 'Write a REST API handler in Node.js.');
  assert.strictEqual(outOfScope.inScope, false, 'Must preserve domain specialization boundaries');
  assert.ok(outOfScope.recommendedAgents.some(r => r.id === 'agent-046' || r.id === 'agent-033'));
});

test('3. Quality Preservation — Super AI Agent 101 Orchestration Authority', () => {
  const superAgent = { agent_id: 'agent-101', name: 'Super AI Agent', category: 'Master Orchestrator' };
  const multiDomainTask = 'Build a full-stack website with database and automated tests.';

  const decision = agentScopeGuard.checkScope(superAgent, multiDomainTask);
  assert.strictEqual(decision.inScope, true, 'Super AI Agent must retain full cross-domain authority');
  assert.strictEqual(decision.isMasterOrchestrator, true);
});
