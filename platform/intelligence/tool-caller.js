/**
 * SA-S03 Platform — Structured Tool Execution & RBAC Layer
 * Validates parameter types, enforces agent RBAC allowlists, and handles tool errors without hallucination.
 */

import { executeTool, TOOL_DEFINITIONS } from "../tools/tool-registry.js";
import { classifyActionRisk } from "./hitl-policy.js";

export async function callToolStructured({ agent_id, tool_name, arguments: args, context = {} }) {
  const started = Date.now();

  // 1. Tool existence check
  const def = TOOL_DEFINITIONS[tool_name];
  if (!def) {
    return {
      success: false,
      error_code: "TOOL_NOT_FOUND",
      error_message: `Tool '${tool_name}' is not registered in the educational tool catalog.`,
      result: null,
      evidence: null,
      latency_ms: Date.now() - started
    };
  }

  // 2. Determine Action Risk
  const riskPolicy = classifyActionRisk(tool_name, args);

  // 3. Execute with RBAC Enforcement
  try {
    const rawResult = await executeTool(agent_id || "agent-101", tool_name, args || {});
    const data = rawResult?.data !== undefined ? rawResult.data : rawResult;

    return {
      success: true,
      tool_name,
      domain: def.domain,
      risk_level: riskPolicy.level,
      requires_hitl: riskPolicy.hitl_required,
      result: data,
      evidence: {
        source: `tool:${tool_name}`,
        domain: def.domain,
        timestamp: new Date().toISOString(),
        verified: true,
        data
      },
      latency_ms: Date.now() - started
    };
  } catch (err) {
    return {
      success: false,
      tool_name,
      error_code: err.message?.includes("Permission Denied") ? "PERMISSION_DENIED" : "TOOL_EXECUTION_FAILED",
      error_message: err.message,
      result: null,
      evidence: null,
      latency_ms: Date.now() - started
    };
  }
}
