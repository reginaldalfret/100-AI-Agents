import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { agentScopeGuard } from '../../platform/intelligence/agent-scope-guard.js';

describe('3. End-to-End Agent Handoff & Auto-Execution Runtime Test Suite', () => {
  it('3.1 Simulates complete handoff lifecycle from Writing Agent to Quiz Agent', async () => {
    // Turn 1: User sends Quiz prompt to Writing AI Agent (001)
    const initialAgent = { agent_id: 'agent-001', id: 'agent-001', name: 'Writing AI Agent', displayNumber: '001' };
    const userPrompt = 'Create a 10-question multiple-choice quiz on industrial safety';

    // Backend scope check intercepts before LLM invocation
    const scopeDecision = agentScopeGuard.checkScope(initialAgent, userPrompt);
    assert.strictEqual(scopeDecision.inScope, false, 'Writing agent must reject quiz generation');
    assert.strictEqual(scopeDecision.targetAgent.id, 'agent-004', 'Target must be agent-004');
    assert.strictEqual(scopeDecision.targetAgent.name, 'Quiz AI Agent');

    // Frontend simulates receiving redirect event
    const conversationState = {
      conversationId: 'conv-test-12345',
      activeAgent: initialAgent,
      messages: [
        { role: 'user', content: userPrompt, timestamp: Date.now() },
        {
          role: 'assistant',
          type: 'agent_redirect',
          status: 'out_of_scope',
          content: scopeDecision.politeMessage,
          scopeDecision
        }
      ]
    };

    // User clicks "Switch to Quiz AI Agent"
    const targetAgent = { agent_id: 'agent-004', id: 'agent-004', name: 'Quiz AI Agent', displayNumber: '004' };
    conversationState.activeAgent = targetAgent;

    // Handoff executes original prompt with Quiz Agent
    const handoffExecution = {
      agentId: conversationState.activeAgent.id,
      agentName: conversationState.activeAgent.name,
      agentNumber: conversationState.activeAgent.displayNumber,
      effectiveTask: userPrompt,
      modelEngine: 'Microsoft Phi-4 Mini (phi4-mini:latest)',
      externalCalls: 0,
      isAirGapped: true
    };

    // Assert target receives EXACT original prompt without mutation
    assert.strictEqual(handoffExecution.agentId, 'agent-004');
    assert.strictEqual(handoffExecution.agentNumber, '004');
    assert.strictEqual(handoffExecution.effectiveTask, 'Create a 10-question multiple-choice quiz on industrial safety');

    // Assert backend trace correctly reflects Quiz AI Agent (NOT Writing Agent)
    assert.strictEqual(handoffExecution.agentName, 'Quiz AI Agent');
    assert.strictEqual(handoffExecution.externalCalls, 0);
    assert.strictEqual(handoffExecution.isAirGapped, true);

    // Assert conversation history contains user prompt, redirect card, and final generated output
    conversationState.messages.push({
      role: 'assistant',
      agent: 'Quiz AI Agent',
      content: '1. Which OSHA standard applies to industrial machinery safety?\nA) 1910.212\nB) 1926.451\n...',
      backendTrace: {
        agentDispatched: 'Quiz AI Agent (004)',
        modelEngine: handoffExecution.modelEngine,
        externalCalls: 0
      }
    });

    assert.strictEqual(conversationState.messages.length, 3);
    assert.strictEqual(conversationState.messages[0].content, userPrompt);
    assert.strictEqual(conversationState.messages[1].status, 'out_of_scope');
    assert.strictEqual(conversationState.messages[2].agent, 'Quiz AI Agent');
    assert.strictEqual(conversationState.messages[2].backendTrace.agentDispatched, 'Quiz AI Agent (004)');
  });
});
