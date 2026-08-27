/**
 * Sovereign AI Workbench — 301 Super Orchestrator Controller
 */
import { EventEmitter } from 'node:events';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { routeAgentToModel } from '../models/model-router.js';
import { routeAgentToTool } from '../tools/tool-router.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

export class OrchestratorController extends EventEmitter {
  constructor() {
    super();
    this.routingHistory = [];
  }

  /**
   * Main entry point: determines intent, agent, model, tools.
   * Returns { intent, selectedAgent, selectedModel, selectedTools, executionTarget, routingTrace }
   */
  async processRequest(userInput, context = {}) {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    
    const intent = this._classifyIntent(userInput);
    const executionPath = this._selectExecutionPath(intent, context);
    const isManualSelection = Boolean(context.agentId && context.agentId !== 'auto');
    
    let routeResult;
    if (executionPath.type === 'integration') {
      routeResult = await this.routeToAgentIntegration(executionPath.agentId, userInput, context);
    } else {
      routeResult = await this.routeToSpecialist(executionPath.agentId, userInput, context);
    }
    
    const trace = {
      requestId,
      timestamp: new Date().toISOString(),
      userInputSummary: userInput.substring(0, 60) + (userInput.length > 60 ? '...' : ''),
      intent,
      selectionType: isManualSelection ? 'MANUAL' : 'AUTO',
      selectionReason: isManualSelection 
        ? `Direct user selection of agent '${routeResult.agentId}'` 
        : `Autonomous 301 Orchestrator matched intent '${intent}'`,
      candidatesConsidered: isManualSelection 
        ? [routeResult.agentId] 
        : ['hermes', 'opencode', 'codex', 'openclaw', 'pi', 'copilot-cli', '301-specialists'],
      selectedAgent: routeResult.agentId,
      agentName: routeResult.agentName || routeResult.agentId,
      selectedModel: routeResult.modelId,
      modelName: routeResult.modelName || routeResult.modelId,
      executionTarget: routeResult.executionTarget || 'GPU',
      hardware: routeResult.executionTarget === 'CPU' ? 'Intel Core i5 (CPU)' : 'RTX 2050 (4GB VRAM)',
      selectedTools: routeResult.tools || [],
      network_mode: 'LOCAL_ONLY',
      external_calls: 0,
      routingDurationMs: Date.now() - startTime
    };
    
    this.routingHistory.push(trace);
    
    return {
      intent,
      selectedAgent: routeResult.agentId,
      agentName: routeResult.agentName || routeResult.agentId,
      selectedModel: routeResult.modelId,
      modelName: routeResult.modelName || routeResult.modelId,
      selectedTools: routeResult.tools || [],
      executionTarget: trace.executionTarget,
      routingTrace: trace
    };
  }

  /**
   * Routes to an external agent integration.
   */
  async routeToAgentIntegration(agentId, task, context = {}) {
    const intent = this._classifyIntent(task);
    const modelRoute = routeAgentToModel(agentId, intent, {
      modelMode: context.modelMode,
      model_override: context.model_override
    });

    let tools = [];
    try {
      tools = routeAgentToTool(agentId, intent);
    } catch {
      tools = ['filesystem', 'terminal'];
    }

    return {
      agentId,
      agentName: agentId.toUpperCase(),
      modelId: modelRoute.model_id,
      modelName: modelRoute.model_name,
      executionTarget: modelRoute.execution_target,
      reason: modelRoute.reason,
      tools
    };
  }

  /**
   * Routes to an existing 301 specialist agent.
   */
  async routeToSpecialist(agentId, task, context = {}) {
    const intent = this._classifyIntent(task);
    let modelId = 'nemotron-3-nano';
    let modelName = 'NVIDIA Nemotron 3 Nano';
    let tools = ['search_knowledge'];

    if (intent === 'CODING' || intent === 'DEBUGGING') {
      modelId = 'local-code-specialist';
      modelName = 'Qwen 2.5 Coder 1.5B';
      tools = ['execute_python_sandbox', 'rag_query_codebase'];
    } else if (intent === 'MATH' || intent === 'SCIENCE') {
      modelId = 'phi4-mini';
      modelName = 'Microsoft Phi-4 Mini';
      tools = ['calculate_step_by_step'];
    }

    return {
      agentId,
      agentName: '301 Specialist Fleet',
      modelId,
      modelName,
      executionTarget: 'GPU',
      tools
    };
  }

  /**
   * Returns full routing trace for "WHY THIS ROUTE?" panel.
   */
  getRoutingTrace(requestId) {
    return this.routingHistory.find(t => t.requestId === requestId) || null;
  }

  /**
   * Classifies user intent into categories.
   */
  _classifyIntent(userInput) {
    const input = (userInput || '').toLowerCase();
    if (input.includes('code') || input.includes('debug') || input.includes('bug') || input.includes('function') || input.includes('script') || input.includes('python') || input.includes('javascript') || input.includes('refactor')) return 'CODING';
    if (input.includes('math') || input.includes('calculate') || input.includes('equation') || input.includes('integral') || input.includes('algebra')) return 'MATH';
    if (input.includes('research') || input.includes('find') || input.includes('search') || input.includes('investigate')) return 'RESEARCH';
    if (input.includes('file') || input.includes('directory') || input.includes('folder') || input.includes('path')) return 'FILE_OPERATIONS';
    if (input.includes('terminal') || input.includes('command') || input.includes('shell') || input.includes('powershell') || input.includes('bash')) return 'TERMINAL_COMMANDS';
    if (input.includes('science') || input.includes('physics') || input.includes('chemistry') || input.includes('biology')) return 'SCIENCE';
    if (input.includes('write') || input.includes('draft') || input.includes('essay') || input.includes('email') || input.includes('letter')) return 'WRITING';
    return 'GENERAL_CHAT';
  }

  /**
   * Determines whether to use agent integration or specialist.
   */
  _selectExecutionPath(intent, context = {}) {
    // 1. Explicit Manual Agent Override
    if (context.agentId && context.agentId !== 'auto') {
      const isIntegration = ['hermes', 'opencode', 'codex', 'openclaw', 'pi', 'copilot-cli'].includes(context.agentId.toLowerCase());
      return {
        type: isIntegration ? 'integration' : 'specialist',
        agentId: context.agentId
      };
    }

    // 2. Check if any agent integrations are running and capable
    const runningIntegrations = context.integrationsRunning || [];
    if (runningIntegrations.length > 0) {
      return { type: 'integration', agentId: runningIntegrations[0] };
    }
    
    // 3. Otherwise fall through to existing 301 specialist routing
    return { type: 'specialist', agentId: `301-${intent.toLowerCase()}-specialist` };
  }
}

export const orchestratorController = new OrchestratorController();
