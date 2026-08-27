/**
 * Sovereign AI Workbench — 301 Super Orchestrator Controller
 */
import { EventEmitter } from 'node:events';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
    
    let routeResult;
    if (executionPath.type === 'integration') {
      routeResult = await this.routeToAgentIntegration(executionPath.agentId, userInput);
    } else {
      routeResult = await this.routeToSpecialist(executionPath.agentId, userInput);
    }
    
    const trace = {
      requestId,
      timestamp: new Date().toISOString(),
      userInputSummary: userInput.substring(0, 50) + (userInput.length > 50 ? '...' : ''),
      intent,
      candidatesConsidered: ['coder-agent', 'research-agent', 'general-agent', 'external-agent-integration'],
      selectedAgent: routeResult.agentId,
      selectedModel: routeResult.modelId,
      executionTarget: 'GPU', // Simplified for prototype
      selectedTools: routeResult.tools || [],
      routingDurationMs: Date.now() - startTime
    };
    
    this.routingHistory.push(trace);
    
    return {
      intent,
      selectedAgent: routeResult.agentId,
      selectedModel: routeResult.modelId,
      selectedTools: routeResult.tools || [],
      executionTarget: trace.executionTarget,
      routingTrace: trace
    };
  }

  /**
   * Routes to an external agent integration.
   */
  async routeToAgentIntegration(agentId, task) {
    // Uses the agent router and model router to spin up the external integration
    return {
      agentId,
      modelId: 'llama3.2-1b',
      tools: ['search_knowledge']
    };
  }

  /**
   * Routes to an existing 301 specialist agent.
   */
  async routeToSpecialist(agentId, task) {
    // Routes to internal 301 AI Agent specialists
    return {
      agentId,
      modelId: 'qwen2.5-coder:1.5b',
      tools: ['execute_python_sandbox', 'rag_query_codebase']
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
    const input = userInput.toLowerCase();
    if (input.includes('code') || input.includes('debug') || input.includes('bug')) return 'CODING';
    if (input.includes('math') || input.includes('calculate')) return 'MATH';
    if (input.includes('research') || input.includes('find')) return 'RESEARCH';
    if (input.includes('file') || input.includes('directory')) return 'FILE_OPERATIONS';
    if (input.includes('terminal') || input.includes('run')) return 'TERMINAL_COMMANDS';
    if (input.includes('science')) return 'SCIENCE';
    if (input.includes('write') || input.includes('draft')) return 'WRITING';
    return 'GENERAL_CHAT';
  }

  /**
   * Determines whether to use agent integration or specialist.
   */
  _selectExecutionPath(intent, context) {
    // Check if any agent integrations are RUNNING and capable
    const runningIntegrations = context.integrationsRunning || [];
    if (runningIntegrations.length > 0) {
      // Pick first suitable integration
      return { type: 'integration', agentId: runningIntegrations[0] };
    }
    
    // Otherwise fall through to existing 301 specialist routing
    return { type: 'specialist', agentId: `301-${intent.toLowerCase()}-specialist` };
  }
}

export const orchestratorController = new OrchestratorController();
