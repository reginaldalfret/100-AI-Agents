import fs from "node:fs";
import { fileURLToPath } from "node:url";

const AGENT_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const AGENT_CONFIG_PATH = `${AGENT_ROOT}/agent.json`;

function loadAgentFile() {
  try {
    if (!fs.existsSync(AGENT_CONFIG_PATH)) {
      return {};
    }

    return JSON.parse(
      fs.readFileSync(AGENT_CONFIG_PATH, "utf8")
    );
  } catch (error) {
    throw new Error(
      `Unable to load agent configuration: ${AGENT_CONFIG_PATH}: ${error.message}`
    );
  }
}

const fileConfig = loadAgentFile();

const envCapabilities = process.env.AGENT_CAPABILITIES
  ? process.env.AGENT_CAPABILITIES
      .split(",")
      .map(value => value.trim())
      .filter(Boolean)
  : null;

export const AGENT_CONFIG = Object.freeze({
  id:
    process.env.AGENT_ID ||
    fileConfig.agent_id ||
    "agent-template",

  name:
    process.env.AGENT_NAME ||
    fileConfig.name ||
    "100-to-1 Agent Template",

  version:
    process.env.AGENT_VERSION ||
    fileConfig.version ||
    "1.0.0",

  category:
    process.env.AGENT_CATEGORY ||
    fileConfig.category ||
    "foundation",

  model:
    process.env.OLLAMA_MODEL ||
    fileConfig.model ||
    "qwen3.5:9b",

  systemPrompt:
    process.env.AGENT_SYSTEM_PROMPT ||
    fileConfig.system_prompt ||
    "You are a specialized AI agent. Follow the task, context, and parameters precisely.",

  capabilities:
    envCapabilities ||
    fileConfig.capabilities ||
    ["reasoning", "structured-output"],

  uiType:
    process.env.AGENT_UI_TYPE ||
    fileConfig.ui_type ||
    "task"
});
