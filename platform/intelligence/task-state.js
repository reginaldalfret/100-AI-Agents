/**
 * Sovereign AI Workbench — Canonical Task State Model
 * Encapsulates full execution state, DAG progress, evidence, missing items, and replanning traces.
 */

export const TaskStatus = {
  PLANNING: "planning",
  EXECUTING: "executing",
  EVALUATING: "evaluating",
  REPLANNING: "replanning",
  WAITING_FOR_INPUT: "waiting_for_input",
  WAITING_FOR_APPROVAL: "waiting_for_approval",
  COMPLETED: "completed",
  PARTIAL: "partial",
  FAILED: "failed",
  CANCELLED: "cancelled"
};

export const StepStatus = {
  PENDING: "pending",
  READY: "ready",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  SKIPPED: "skipped",
  BLOCKED: "blocked"
};

export function createTaskState(options = {}) {
  const id = `AUTO-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
  
  return {
    task_id: options.task_id || id,
    trace_id: options.trace_id || id,
    conversation_id: options.conversation_id || `CONV-${Date.now()}`,
    goal: options.goal || "",
    execution_strategy: options.execution_strategy || "AUTONOMOUS_PLAN", // or EXISTING_WORKFLOW
    constraints: Array.isArray(options.constraints) ? options.constraints : [],
    inputs: Array.isArray(options.inputs) ? options.inputs : [],
    entities: Array.isArray(options.entities) ? options.entities : [],
    requirements: Array.isArray(options.requirements) ? options.requirements : [],
    plan: Array.isArray(options.plan) ? options.plan : [],
    current_step_id: null,
    completed_steps: [],
    failed_steps: [],
    evidence: [],
    missing_information: [],
    conflicts: [],
    selected_agents: [],
    selected_models: [],
    tool_calls: [],
    artifacts: [],
    risk_level: "low",
    requires_hitl: false,
    replan_count: 0,
    max_replans: 3,
    status: TaskStatus.PLANNING,
    metrics: {
      total_duration_ms: 0,
      agent_calls: 0,
      model_inferences: 0,
      tool_executions: 0,
      external_network_calls: 0
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}
