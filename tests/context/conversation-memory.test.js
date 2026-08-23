/**
 * Comprehensive Conversational Memory & Context Management Test Suite
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { conversationManager } from '../../platform/context/conversation-manager.js';
import { entityMemory } from '../../platform/context/entity-memory.js';
import { topicMemory } from '../../platform/context/topic-memory.js';
import { referenceResolver } from '../../platform/context/reference-resolver.js';
import { contextWindowManager } from '../../platform/context/context-window.js';

test('Mandatory Bug Regression — Renewable Energy Multi-Turn Context', () => {
  const convId = `test-renew-${Date.now()}`;
  
  // Turn 1: User asks for renewable energy article
  const turn1User = 'Write a professional article about renewable energy.';
  const turn1Ai = 'Renewable energy is derived from natural processes that are replenished constantly...';
  
  conversationManager.appendMessage(convId, { role: 'user', content: turn1User });
  conversationManager.appendMessage(convId, { role: 'assistant', content: turn1Ai });
  conversationManager.recordTurn({
    conversationId: convId,
    userPrompt: turn1User,
    assistantResponse: turn1Ai,
    agent: { agent_id: 'agent-001', name: 'Writing AI Agent', domain: 'Writing' }
  });

  // Turn 2: Follow-up with pronoun "it"
  const turn2User = 'write about the types in it';
  const prep = conversationManager.prepareContext({
    conversationId: convId,
    agent: { agent_id: 'agent-001', name: 'Writing AI Agent', domain: 'Writing' },
    task: turn2User
  });

  // Assertions:
  assert.ok(prep.resolvedContext, 'Resolved context must exist');
  assert.strictEqual(prep.resolvedContext.activeTopic, 'Renewable Energy', 'Topic must be Renewable Energy');
  
  const itRef = prep.resolvedContext.resolvedReferences.find(r => r.surface.toLowerCase() === 'it');
  assert.ok(itRef, 'Must resolve "it" coreference');
  assert.strictEqual(itRef.target, 'Renewable Energy', '"it" must resolve to Renewable Energy');
  
  // The system prompt should include the topic context
  assert.ok(prep.systemPrompt.includes('Renewable Energy'), 'System prompt must contain topic context');
  
  // The assembled prompt / messages must include prior turns
  assert.ok(prep.messages.length >= 3, 'Messages array must contain history + current turn');
  assert.strictEqual(prep.messages[0].content, turn1User);
  assert.strictEqual(prep.messages[1].content, turn1Ai);
  assert.strictEqual(prep.messages[2].content, turn2User);
});

test('Multi-Turn Ordinal Resolution — "Which one is best for homes?"', () => {
  const convId = `test-ordinal-${Date.now()}`;
  
  conversationManager.appendMessage(convId, { role: 'user', content: 'What are the types of renewable energy?' });
  conversationManager.appendMessage(convId, { role: 'assistant', content: '1. Solar Energy\n2. Wind Energy\n3. Geothermal Energy\n4. Biomass' });
  conversationManager.recordTurn({
    conversationId: convId,
    userPrompt: 'What are the types of renewable energy?',
    assistantResponse: '1. Solar Energy\n2. Wind Energy\n3. Geothermal Energy\n4. Biomass',
    agent: { agent_id: 'agent-001', name: 'Writing AI Agent' }
  });

  const turn3User = 'Which one is most suitable for homes?';
  const prep = conversationManager.prepareContext({
    conversationId: convId,
    agent: { agent_id: 'agent-001', name: 'Writing AI Agent' },
    task: turn3User
  });

  assert.ok(prep.resolvedContext.activeTopic.includes('Renewable Energy'), 'Topic must be preserved');
  assert.ok(prep.resolvedContext.resolvedReferences.length > 0, 'Must resolve reference in comparative query');
});

test('Cross-Conversation Memory Isolation — Zero Leakage Guarantee', () => {
  const chatA = `test-chatA-${Date.now()}`;
  const chatB = `test-chatB-${Date.now()}`;

  // Chat A: Renewable energy
  conversationManager.appendMessage(chatA, { role: 'user', content: 'Explain solar panels.' });
  conversationManager.appendMessage(chatA, { role: 'assistant', content: 'Solar panels convert sunlight to electricity.' });
  conversationManager.recordTurn({
    conversationId: chatA,
    userPrompt: 'Explain solar panels.',
    assistantResponse: 'Solar panels convert sunlight to electricity.'
  });

  // Chat B: Python Programming
  conversationManager.appendMessage(chatB, { role: 'user', content: 'Write a Python function to calculate fibonacci.' });
  conversationManager.appendMessage(chatB, { role: 'assistant', content: 'def fib(n): return n if n <= 1 else fib(n-1)+fib(n-2)' });
  conversationManager.recordTurn({
    conversationId: chatB,
    userPrompt: 'Write a Python function to calculate fibonacci.',
    assistantResponse: 'def fib(n): return n if n <= 1 else fib(n-1)+fib(n-2)'
  });

  // In Chat B, ask "explain it"
  const prepB = conversationManager.prepareContext({
    conversationId: chatB,
    agent: { agent_id: 'agent-018', name: 'Python AI Agent' },
    task: 'explain it'
  });

  // Chat B must NOT have any mention of solar panels
  assert.strictEqual(prepB.resolvedContext.activeTopic.includes('Solar'), false, 'Chat B must not leak solar topic');
  assert.ok(prepB.messages.some(m => m.content.includes('fibonacci')), 'Chat B must retain fibonacci context');
});

test('Context Window Manager — Token Budget Bounds', () => {
  const fitted = contextWindowManager.fitContext({
    systemPrompt: 'You are an industrial expert.',
    summary: 'Prior discussion on HX-204.',
    recentTurns: [
      { id: '1', role: 'user', content: 'Turn 1 content' },
      { id: '2', role: 'assistant', content: 'Turn 2 content' }
    ],
    currentPrompt: 'What is the current status?'
  });

  assert.ok(fitted.includedRecent.length === 2, 'All recent turns within budget must be included');
  assert.ok(fitted.estimatedTotalTokens < 2048, 'Total tokens must remain within budget');
});
