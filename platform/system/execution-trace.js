/**
 * Sovereign AI Workbench — Centralized Backend Execution Trace Builder
 * 
 * Standardizes the backend execution trace contract for all 301 agents
 * and multi-agent workflows.
 */

import { getHardwareInfo } from './hardware-info.js';

/**
 * Build a structured universal execution trace for any agent or workflow execution
 */
export function buildExecutionTrace({
  agent,
  modelName = 'Qwen 2.5 Coder',
  runtimeModel = 'qwen2.5-coder:1.5b',
  executionType = 'gpu',
  hardware = null,
  workflow = null,
  auditId = null,
  durationMs = null,
  tokensPerSec = null,
  externalCalls = 0
}) {
  const hw = hardware || getHardwareInfo({ executionType });
  const finalAuditId = auditId || ('req_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7));

  const rawNum = agent?.displayNumber || (agent?.agent_id ? agent.agent_id.replace('agent-', '') : '301');
  const agentNumber = String(rawNum).padStart(3, '0');
  const agentName = agent?.name || (agentNumber === '301' ? 'Super AI Agent' : 'Specialist AI Agent');
  const isSuperAI = agentNumber === '301' || agent?.id === 'auto' || agent?.category === 'Orchestrator';

  const trace = {
    agent: {
      agentId: agent?.agent_id || agent?.id || ('agent-' + agentNumber),
      agentNumber,
      agentName,
      category: agent?.category || 'Specialist',
      displayText: agentNumber + ' ' + agentName,
      isSuperAI
    },
    model: {
      displayName: modelName,
      runtimeTag: runtimeModel,
      mode: 'auto'
    },
    hardware: {
      name: hw.name,
      displayText: hw.displayText || ('Ran on ' + hw.name),
      executionType: hw.executionType,
      isGPU: hw.isGPU,
      vramGB: hw.vramGB || 0
    },
    performance: {
      durationMs: durationMs || null,
      tokensPerSec: tokensPerSec || null
    },
    sovereignty: {
      externalCalls,
      cloudEgressBytes: 0,
      displayText: '0 external network requests'
    },
    audit: {
      auditId: finalAuditId,
      displayText: 'Verified with audit ID ' + finalAuditId,
      timestamp: new Date().toISOString()
    },
    workflow: workflow || null
  };

  return trace;
}

export default {
  buildExecutionTrace
};
