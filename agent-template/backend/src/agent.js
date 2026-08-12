import { generateWithOllama, modelHealth, DEFAULT_MODEL, DEFAULT_OLLAMA_URL } from "./model.js";

const AGENT_ID = process.env.AGENT_ID || "agent-template";
const AGENT_NAME = process.env.AGENT_NAME || "100-to-1 Agent Template";
const AGENT_VERSION = process.env.AGENT_VERSION || "1.0.0";
const SYSTEM_PROMPT = process.env.AGENT_SYSTEM_PROMPT ||
  "You are a specialized 100-to-1 AI agent. Perform the requested task accurately, follow the provided context and parameters, and return useful structured output.";

export function agentInfo() {
  return {
    agent_id: AGENT_ID,
    agent_name: AGENT_NAME,
    version: AGENT_VERSION,
    model: DEFAULT_MODEL,
    backend: DEFAULT_OLLAMA_URL
  };
}

export async function health() {
  const model = await modelHealth();
  return {
    status: model.available ? "ok" : "offline",
    agent_id: AGENT_ID,
    agent_name: AGENT_NAME,
    version: AGENT_VERSION,
    timestamp: new Date().toISOString(),
    model: DEFAULT_MODEL,
    backend: DEFAULT_OLLAMA_URL,
    model_available: model.available
  };
}

export async function runAgent(request) {
  const task = typeof request?.task === "string" ? request.task.trim() : "";
  if (!task) throw new Error("task is required");
  if (task.length > 20000) throw new Error("task exceeds the 20000 character limit");

  const context = request.context && typeof request.context === "object" ? request.context : {};
  const parameters = request.parameters && typeof request.parameters === "object" ? request.parameters : {};
  const temperature = Number.isFinite(Number(parameters.temperature))
    ? Math.min(1.5, Math.max(0, Number(parameters.temperature)))
    : 0.4;

  const system = [
    SYSTEM_PROMPT,
    "Return the best possible answer for the user's task.",
    `Context JSON: ${JSON.stringify(context)}`,
    `Parameters JSON: ${JSON.stringify(parameters)}`
  ].join("\n\n");

  const modelResponse = await generateWithOllama({
    system,
    task,
    temperature,
    model: parameters.model || DEFAULT_MODEL
  });

  const result = typeof modelResponse.response === "string"
    ? modelResponse.response
    : modelResponse;

  return {
    agent_id: AGENT_ID,
    agent_name: AGENT_NAME,
    status: "success",
    result,
    metadata: {
      model: modelResponse.model || parameters.model || DEFAULT_MODEL,
      output_format: request.output_format || "structured",
      duration_ms: modelResponse.total_duration
        ? Math.round(modelResponse.total_duration / 1e6)
        : null
    },
    error: null
  };
}
