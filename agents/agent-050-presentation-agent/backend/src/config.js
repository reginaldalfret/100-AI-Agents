export const AGENT_CONFIG = Object.freeze({
  id: process.env.AGENT_ID || "agent-template",
  name: process.env.AGENT_NAME || "100-to-1 Agent Template",
  version: process.env.AGENT_VERSION || "1.0.0",
  category: process.env.AGENT_CATEGORY || "foundation",
  systemPrompt: process.env.AGENT_SYSTEM_PROMPT || "You are a specialized AI agent. Follow the task, context, and parameters precisely.",
  capabilities: (process.env.AGENT_CAPABILITIES || "reasoning,structured-output").split(",").map(value => value.trim()).filter(Boolean)
});
