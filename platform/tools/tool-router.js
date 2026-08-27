/**
 * Sovereign AI Workbench — Tool Router
 * Agent→tool routing layer.
 */
import { TOOL_DEFINITIONS, isToolAllowed } from "./tool-registry.js";
// Using dynamic import or mock import for agent-permissions.js as instructed
import { checkAgentPermission } from "../agents/agent-permissions.js";

/**
 * Determines tools available to an agent.
 */
export function routeAgentToTool(agentId, taskType) {
  // Returns subset of tools based on taskType and agentId
  return getToolCategories()[taskType] || [];
}

/**
 * Keyword-based tool ranking for a task.
 */
export function getToolsForTask(taskDescription) {
  // Mock logic: keyword matching
  const tools = [];
  if (taskDescription.includes('pdf') || taskDescription.includes('document')) {
    tools.push('extract_pdf', 'ocr_document');
  }
  if (taskDescription.includes('calculate') || taskDescription.includes('math')) {
    tools.push('calculate_step_by_step');
  }
  return tools;
}

/**
 * Wraps tool execution with RBAC.
 */
export async function executeToolForAgent(agentId, toolName, params) {
  const isAllowed = typeof isToolAllowed === 'function' ? isToolAllowed(toolName) : true;
  const hasPerm = typeof checkAgentPermission === 'function' ? checkAgentPermission(agentId, toolName) : true;
  
  if (!isAllowed || !hasPerm) {
    throw new Error(`Tool execution denied for agent ${agentId} on tool ${toolName}`);
  }
  
  // Implementation of actual tool run goes here
  return { status: 'success', toolName, agentId, result: 'Tool execution simulated' };
}

/**
 * Returns categorized tools.
 */
export function getToolCategories() {
  return {
    DOCUMENT: ['ocr_document', 'extract_pdf', 'python.ocr', 'read_excel', 'analyze_image'],
    COMPUTE: ['calculate_step_by_step', 'python.calculate', 'execute_python_sandbox'],
    STORAGE: ['search_knowledge', 'rag_search', 'rag_query_codebase'],
    DATA: ['python.analyzeData', 'python.embed', 'python.rerank'],
    DELIVERABLE: ['generate_docx', 'generate_xlsx', 'generate_pptx']
  };
}
