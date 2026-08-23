import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SuperAIWorkflowEngine } from '../../platform/workflow-engine/super-ai-workflow-engine.js';
import { agentScopeGuard } from '../../platform/intelligence/agent-scope-guard.js';
import { buildExecutionTrace } from '../../platform/system/execution-trace.js';
import { getHardwareInfo } from '../../platform/system/hardware-info.js';

describe('Agent Execution Smoke & Runtime Verification Suite', () => {

  it('1. Email Specialist Scope & Routing: Evaluates in-scope request cleanly', () => {
    const scope = agentScopeGuard.checkScope({ agent_id: 'agent-002', name: 'Email AI Agent' }, 'Draft a polite reply to this client addressing their concerns');
    assert.equal(scope.inScope, true, 'Email prompt must be in scope for 002 Email AI Agent');
  });

  it('2. Quiz Specialist Scope & Routing: Evaluates in-scope request cleanly', () => {
    const scope = agentScopeGuard.checkScope({ agent_id: 'agent-004', name: 'Quiz AI Agent' }, 'Create 5 quiz questions about Python');
    assert.equal(scope.inScope, true, 'Quiz prompt must be in scope for 004 Quiz AI Agent');
  });

  it('3. Out-Of-Scope Guard: Redirects non-domain tasks with polite switch recommendation', () => {
    const scope = agentScopeGuard.checkScope({ agent_id: 'agent-004', name: 'Quiz AI Agent' }, 'Draft an urgent email to the supplier regarding invoice delay');
    assert.equal(scope.inScope, false, 'Email task must be out-of-scope for Quiz Agent');
    assert.ok(scope.recommendedAgent || scope.recommendedAgents, 'Must suggest alternative specialist');
  });

  it('4. Single Specialist Universal Trace Generation', () => {
    const hw = getHardwareInfo({ executionType: 'gpu' });
    const trace = buildExecutionTrace({
      agent: { agent_id: 'agent-002', displayNumber: '002', name: 'Email AI Agent', category: 'Writing & Communication' },
      modelName: 'NVIDIA Nemotron 3',
      runtimeModel: 'nemotron-3-nano:latest',
      executionType: 'gpu',
      hardware: hw,
      auditId: 'smoke-test-trace-002',
      durationMs: 1200,
      tokensPerSec: 32.5
    });

    assert.equal(trace.agent.agentNumber, '002');
    assert.equal(trace.agent.displayText, '002 Email AI Agent');
    assert.ok(trace.hardware.displayText.startsWith('Ran on'));
    assert.equal(trace.sovereignty.externalCalls, 0);
  });

  it('5. Super AI Master Multi-Agent Workflow Decomposition (C++, Java, Python)', async () => {
    const engine = new SuperAIWorkflowEngine();
    const plan = engine.planWorkflow('Write a palindrome program in C++, Java, Python');

    assert.equal(plan.isFastPath, false);
    assert.equal(plan.subtasks.length, 3);
    assert.ok(plan.subtasks.some(s => s.technology === 'C++'));
    assert.ok(plan.subtasks.some(s => s.technology === 'Java'));
    assert.ok(plan.subtasks.some(s => s.technology === 'Python'));

    const result = await engine.executeWorkflow(plan, {
      executeAgentFn: async (contract) => ({
        code: '// ' + contract.technology + ' implementation',
        explanation: 'Clean O(N) palindrome logic',
        model: 'qwen2.5-coder:1.5b'
      })
    });

    assert.equal(result.status, 'COMPLETED');
    assert.ok(result.finalSynthesis.includes('# Multi-Agent Implementation — 301 Super AI Agent'));
    assert.equal(result.artifacts.length, 3);
  });

  it('6. Master Orchestrator Public Identity Consistency', () => {
    const engine = new SuperAIWorkflowEngine();
    const plan = engine.planWorkflow('Build an e-commerce store with HTML, CSS, JavaScript');

    assert.equal(plan.rootAgentNumber, '301');
    assert.equal(plan.rootAgentName, '301 Super AI Agent');
    assert.ok(plan.subtasks.length >= 3);
  });
});
