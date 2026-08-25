import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { agentScopeGuard } from '../../platform/intelligence/agent-scope-guard.js';

describe('2. Agent Scope Guard Structured Redirect Contract Test Suite', () => {
  it('2.1 Writing AI Agent (001) -> Quiz AI Agent (004) redirect contract', () => {
    const writingAgent = { agent_id: 'agent-001', name: 'Writing AI Agent', category: 'Writing & Communication' };
    const prompt = 'Create a 10-question multiple-choice quiz on industrial safety';

    const decision = agentScopeGuard.checkScope(writingAgent, prompt);

    assert.strictEqual(decision.inScope, false);
    assert.strictEqual(decision.type, 'agent_redirect');
    assert.strictEqual(decision.status, 'out_of_scope');
    assert.strictEqual(decision.confidence, 0.98);

    // Source Agent verification
    assert.strictEqual(decision.sourceAgent.id, 'agent-001');
    assert.strictEqual(decision.sourceAgent.number, '001');
    assert.strictEqual(decision.sourceAgent.name, 'Writing AI Agent');

    // Target Agent verification
    assert.strictEqual(decision.targetAgent.id, 'agent-004');
    assert.strictEqual(decision.targetAgent.number, '004');
    assert.strictEqual(decision.targetAgent.name, 'Quiz AI Agent');

    // Reason & Prompt verification
    assert.strictEqual(decision.reason, 'quiz_generation');
    assert.strictEqual(decision.originalPrompt, prompt);

    // Polite message assertions
    assert.ok(decision.politeMessage.includes('outside my specialization'));
    assert.ok(decision.politeMessage.includes('Quiz AI Agent'));
    assert.ok(!decision.politeMessage.toLowerCase().includes('cannot'));
    assert.ok(!decision.politeMessage.toLowerCase().includes('wrong agent'));
  });

  it('2.2 Writing AI Agent (001) -> Email AI Agent (002) redirect contract', () => {
    const writingAgent = { agent_id: 'agent-001', name: 'Writing AI Agent', category: 'Writing & Communication' };
    const prompt = 'Write a professional email to my manager requesting a project review';

    const decision = agentScopeGuard.checkScope(writingAgent, prompt);

    assert.strictEqual(decision.inScope, false);
    assert.strictEqual(decision.type, 'agent_redirect');
    assert.strictEqual(decision.sourceAgent.id, 'agent-001');
    assert.strictEqual(decision.targetAgent.id, 'agent-002');
    assert.strictEqual(decision.targetAgent.name, 'Email AI Agent');
    assert.strictEqual(decision.targetAgent.number, '002');
    assert.strictEqual(decision.reason, 'email_writing');
    assert.strictEqual(decision.originalPrompt, prompt);
  });

  it('2.3 Quiz AI Agent (004) -> Email AI Agent (002) redirect contract', () => {
    const quizAgent = { agent_id: 'agent-004', name: 'Quiz AI Agent', category: 'Education & Learning' };
    const prompt = 'Compose a formal email for summer internship application';

    const decision = agentScopeGuard.checkScope(quizAgent, prompt);

    assert.strictEqual(decision.inScope, false);
    assert.strictEqual(decision.type, 'agent_redirect');
    assert.strictEqual(decision.sourceAgent.id, 'agent-004');
    assert.strictEqual(decision.targetAgent.id, 'agent-002');
    assert.strictEqual(decision.targetAgent.name, 'Email AI Agent');
  });

  it('2.4 Email AI Agent (002) -> Quiz AI Agent (004) redirect contract', () => {
    const emailAgent = { agent_id: 'agent-002', name: 'Email AI Agent', category: 'Writing & Communication' };
    const prompt = 'Generate 10 multiple choice quiz questions on cybersecurity';

    const decision = agentScopeGuard.checkScope(emailAgent, prompt);

    assert.strictEqual(decision.inScope, false);
    assert.strictEqual(decision.type, 'agent_redirect');
    assert.strictEqual(decision.sourceAgent.id, 'agent-002');
    assert.strictEqual(decision.targetAgent.id, 'agent-004');
    assert.strictEqual(decision.targetAgent.name, 'Quiz AI Agent');
  });

  it('2.5 In-scope prompts return inScope=true without redirect metadata', () => {
    const quizAgent = { agent_id: 'agent-004', name: 'Quiz AI Agent', category: 'Education & Learning' };
    const validQuizPrompt = 'Create a 10-question multiple-choice quiz on industrial safety';

    const decision = agentScopeGuard.checkScope(quizAgent, validQuizPrompt);
    assert.strictEqual(decision.inScope, true);
    assert.strictEqual(decision.detectedDomain, 'quiz-assessment');
  });
});
