import {
  generateWithOllama,
  modelHealth,
  DEFAULT_MODEL,
  DEFAULT_OLLAMA_URL
} from "./model.js";

import { AGENT_CONFIG } from "./config.js";

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

export async function runAgent(request) {
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

  const modelResponse = await generateWithOllama({
    system,
    task,
    temperature,
    model:
      parameters.model ||
      AGENT_CONFIG.model ||
      DEFAULT_MODEL
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

      duration_ms:
        modelResponse.total_duration
          ? Math.round(
              modelResponse.total_duration / 1e6
            )
          : null
    },

    error: null
  };
}
