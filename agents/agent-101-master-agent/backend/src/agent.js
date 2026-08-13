import {
  generateWithOllama,
  modelHealth,
  DEFAULT_MODEL,
  DEFAULT_OLLAMA_URL
} from "./model.js";

import { AGENT_CONFIG } from "./config.js";

import {
  checkCapability,
  buildCapabilityError
} from "./capability-gate.js";
import { createPlan } from "./planner.js";
import { delegateMany } from "./delegator.js";
import { synthesize } from "./synthesizer.js";

export function agentInfo() {
  return {
    agent_id: AGENT_CONFIG.id,
    agent_name: AGENT_CONFIG.name,
    version: AGENT_CONFIG.version,
    category: AGENT_CONFIG.category,
    capabilities: AGENT_CONFIG.capabilities,
    model: AGENT_CONFIG.model || DEFAULT_MODEL,
    backend: DEFAULT_OLLAMA_URL,
    ui_type: AGENT_CONFIG.uiType
  };
}

export async function health() {
  const model = await modelHealth();

  return {
    status: model.available ? "ok" : "offline",
    agent_id: AGENT_CONFIG.id,
    agent_name: AGENT_CONFIG.name,
    version: AGENT_CONFIG.version,
    timestamp: new Date().toISOString(),
    model: AGENT_CONFIG.model || DEFAULT_MODEL,
    backend: DEFAULT_OLLAMA_URL,
    model_available: model.available
  };
}

async function directExecution({
  task,
  context,
  parameters,
  temperature
}) {
  const system = [
    AGENT_CONFIG.systemPrompt,

    `Agent ID: ${AGENT_CONFIG.id}`,
    `Agent Name: ${AGENT_CONFIG.name}`,
    `Agent Category: ${AGENT_CONFIG.category}`,

    `Capabilities: ${AGENT_CONFIG.capabilities.join(", ")}`,

    "Return the best possible answer for the user's task.",

    `Context JSON: ${JSON.stringify(context)}`,

    `Parameters JSON: ${JSON.stringify(parameters)}`
  ].join("\n\n");

  return generateWithOllama({
    system,
    task,
    temperature,
    model:
      parameters.model ||
      AGENT_CONFIG.model ||
      DEFAULT_MODEL
  });
}

export async function runAgent(request) {
  const started = Date.now();

  const task =
    typeof request?.task === "string"
      ? request.task.trim()
      : "";

  if (!task) {
    throw new Error("task is required");
  }

  if (task.length > 20000) {
    throw new Error(
      "task exceeds the 20000 character limit"
    );
  }

  /*
   * Deterministic specialization gate.
   */
  const capabilityGate = checkCapability(
    task,
    AGENT_CONFIG
  );

  if (!capabilityGate.allowed) {
    const error = buildCapabilityError(
      AGENT_CONFIG,
      capabilityGate
    );

    return {
      agent_id: AGENT_CONFIG.id,
      agent_name: AGENT_CONFIG.name,
      status: "rejected",
      result: null,
      metadata: {
        capabilities: AGENT_CONFIG.capabilities,
        gate_reason: capabilityGate.reason,
        detected_intents:
          capabilityGate.detectedIntents || []
      },
      error
    };
  }

  const context =
    request.context &&
    typeof request.context === "object"
      ? request.context
      : {};

  const parameters =
    request.parameters &&
    typeof request.parameters === "object"
      ? request.parameters
      : {};

  const temperature = Number.isFinite(
    Number(parameters.temperature)
  )
    ? Math.min(
        1.5,
        Math.max(0, Number(parameters.temperature))
      )
    : 0.4;

  /*
   * ============================================================
   * MASTER AGENT ORCHESTRATION
   * ============================================================
   */

  const plan = await createPlan(task);

  const subtasks = Array.isArray(plan.subtasks)
    ? plan.subtasks
    : [];

  /*
   * Simple task:
   *
   * Planner selected no specialists.
   * Master Agent handles the task directly.
   */
  if (subtasks.length === 0) {
    const modelResponse = await directExecution({
      task,
      context,
      parameters,
      temperature
    });

    const result =
      typeof modelResponse.response === "string"
        ? modelResponse.response
        : modelResponse;

    return {
      agent_id: AGENT_CONFIG.id,
      agent_name: AGENT_CONFIG.name,
      status: "success",
      result,
      metadata: {
        model:
          modelResponse.model ||
          parameters.model ||
          AGENT_CONFIG.model ||
          DEFAULT_MODEL,

        output_format:
          request.output_format || "structured",

        capabilities:
          AGENT_CONFIG.capabilities,

        orchestration: true,
        execution_mode: "direct",
        complexity:
          plan.complexity || "simple",

        planned_agents: [],
        completed_agents: [],
        failed_agents: [],

        duration_ms:
          modelResponse.total_duration
            ? Math.round(
                modelResponse.total_duration / 1e6
              )
            : Date.now() - started
      },
      error: null
    };
  }

  /*
   * Complex/moderate task:
   *
   * 1. Planner selects specialists
   * 2. Master delegates subtasks
   * 3. Specialists execute independently
   * 4. Synthesizer combines their results
   */

  const delegationContext = {
    requester: AGENT_CONFIG.id,
    requester_name: AGENT_CONFIG.name,
    original_task: task,
    original_context: context
  };

  const results = await delegateMany(
    subtasks,
    delegationContext
  );

  const synthesis = await synthesize({
    originalTask: task,
    plan,
    results
  });

  const completedAgents = results
    .filter(
      result => result.status === "completed"
    )
    .map(result => result.agent_id);

  const failedAgents = results
    .filter(
      result => result.status === "failed"
    )
    .map(result => result.agent_id);

  return {
    agent_id: AGENT_CONFIG.id,
    agent_name: AGENT_CONFIG.name,
    status: "success",
    result: synthesis.answer,

    metadata: {
      model:
        parameters.model ||
        AGENT_CONFIG.model ||
        DEFAULT_MODEL,

      output_format:
        request.output_format || "structured",

      capabilities:
        AGENT_CONFIG.capabilities,

      orchestration: true,
      execution_mode: "multi-agent",

      complexity:
        plan.complexity || "moderate",

      reasoning:
        plan.reasoning || null,

      planned_agents:
        subtasks.map(
          subtask => subtask.agent_id
        ),

      completed_agents:
        completedAgents,

      failed_agents:
        failedAgents,

      specialist_results:
        results,

      synthesis_confidence:
        synthesis.confidence || "medium",

      used_agents:
        synthesis.used_agents || completedAgents,

      duration_ms:
        Date.now() - started
    },

    error: null
  };
}
