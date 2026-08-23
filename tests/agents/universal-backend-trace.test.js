import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { getHardwareInfo, detectHardware } from '../../platform/system/hardware-info.js';
import { buildExecutionTrace } from '../../platform/system/execution-trace.js';

const ROOT = 'E:/Smart Automation/100-AI-Agents';

describe('Universal Backend Runtime Trace & Hardware Information (All 301 Agents)', () => {
  const agentsJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'registry/agents.json'), 'utf8')).agents;

  it('1. Dynamic Hardware Detection: Detects GPU accelerator and CPU parameters', () => {
    const hw = detectHardware();
    assert.ok(hw, 'Hardware profile must exist');
    assert.ok(hw.gpu, 'GPU object must exist');
    assert.ok(hw.cpu, 'CPU object must exist');
    assert.ok(hw.memory, 'Memory object must exist');

    const gpuInfo = getHardwareInfo({ executionType: 'gpu' });
    assert.ok(gpuInfo.displayText.includes('Ran on'), 'GPU display text must start with Ran on');
    
    const cpuInfo = getHardwareInfo({ executionType: 'cpu' });
    assert.equal(cpuInfo.displayText, 'Ran on CPU', 'CPU display text must be Ran on CPU');
  });

  it('2. Universal Trace Contract for all 301 Agents: Generates valid trace records for entire fleet', () => {
    assert.equal(agentsJson.length, 301, 'Registry must contain 301 agents');

    for (let i = 0; i < agentsJson.length; i++) {
      const agent = agentsJson[i];
      const trace = buildExecutionTrace({
        agent,
        modelName: 'Qwen 2.5 Coder',
        runtimeModel: 'qwen2.5-coder:1.5b',
        executionType: 'gpu',
        auditId: 'audit-test-' + agent.displayNumber
      });

      assert.ok(trace.agent, 'Agent ' + (i+1) + ' must have agent block');
      assert.equal(trace.agent.agentNumber, agent.displayNumber, 'Agent ' + (i+1) + ' must match displayNumber');
      assert.ok(trace.agent.displayText.startsWith(agent.displayNumber + ' '), 'Agent ' + (i+1) + ' display text must start with number');
      assert.ok(trace.model.displayName, 'Agent ' + (i+1) + ' must have model displayName');
      assert.ok(trace.model.runtimeTag, 'Agent ' + (i+1) + ' must have model runtimeTag');
      assert.ok(trace.hardware.displayText.startsWith('Ran on '), 'Agent ' + (i+1) + ' must have hardware info');
      assert.equal(trace.sovereignty.externalCalls, 0, 'Agent ' + (i+1) + ' must have zero external calls');
      assert.ok(trace.audit.auditId, 'Agent ' + (i+1) + ' must have audit ID');
    }
  });

  it('3. Public Master Orchestrator (301 Super AI Agent) Universal Trace', () => {
    const superAiTrace = buildExecutionTrace({
      agent: { id: 'auto', displayNumber: '301', name: 'Super AI Agent', category: 'Orchestrator' },
      modelName: '301 Super AI Agent',
      runtimeModel: 'qwen2.5-coder:1.5b',
      executionType: 'gpu'
    });

    assert.equal(superAiTrace.agent.agentNumber, '301');
    assert.equal(superAiTrace.agent.agentName, 'Super AI Agent');
    assert.equal(superAiTrace.agent.displayText, '301 Super AI Agent');
    assert.ok(superAiTrace.hardware.displayText.includes('Ran on'));
    assert.equal(superAiTrace.sovereignty.externalCalls, 0);
  });

  it('4. Multi-Agent Workflow Universal Trace with Hardware Semantics', () => {
    const workflowObj = {
      workflowId: 'wf-test-123',
      workflowType: 'PARALLEL',
      specialists: [
        { displayNumber: '113', agentName: 'C++ Template AI Agent', technology: 'C++', model: 'qwen2.5-coder:1.5b', status: 'completed', durationMs: 2100 },
        { displayNumber: '107', agentName: 'Java JVM AI Agent', technology: 'Java', model: 'qwen2.5-coder:1.5b', status: 'completed', durationMs: 2300 },
        { displayNumber: '101', agentName: 'Python AsyncIO AI Agent', technology: 'Python', model: 'qwen2.5-coder:1.5b', status: 'completed', durationMs: 1950 }
      ],
      artifacts: [
        { filename: 'palindrome.cpp', lines: 32 },
        { filename: 'Palindrome.java', lines: 28 },
        { filename: 'palindrome.py', lines: 18 }
      ]
    };

    const wfTrace = buildExecutionTrace({
      agent: { id: 'auto', displayNumber: '301', name: 'Super AI Agent', category: 'Orchestrator' },
      modelName: '301 Super AI Agent',
      runtimeModel: 'qwen2.5-coder:1.5b',
      executionType: 'gpu',
      workflow: workflowObj
    });

    assert.ok(wfTrace.workflow);
    assert.equal(wfTrace.workflow.specialists.length, 3);
    assert.equal(wfTrace.workflow.specialists[0].displayNumber, '113');
    assert.equal(wfTrace.workflow.specialists[1].displayNumber, '107');
    assert.equal(wfTrace.workflow.specialists[2].displayNumber, '101');
    assert.ok(wfTrace.hardware.displayText.includes('Ran on'));
  });

  it('5. CPU Compute Semantics: Distinguishes CPU-only tasks from GPU inference', () => {
    const cpuTrace = buildExecutionTrace({
      agent: { displayNumber: '045', name: 'PDF Processing AI Agent', category: 'Automation & Productivity' },
      modelName: 'Python PDF Extractor',
      runtimeModel: 'pypdf / pdfplumber',
      executionType: 'cpu'
    });

    assert.equal(cpuTrace.hardware.displayText, 'Ran on CPU');
    assert.equal(cpuTrace.hardware.isGPU, false);
  });
});
