import fs from "node:fs";
import path from "node:path";

export function loadRegistry(projectRoot) {
  const registryPath = path.join(projectRoot, "registry", "agents.json");

  if (!fs.existsSync(registryPath)) {
    throw new Error(`Agent registry not found: ${registryPath}`);
  }

  return JSON.parse(fs.readFileSync(registryPath, "utf8"));
}

export function findAgentForDay(registry, day) {
  return registry.agents.find((agent) => agent.day === day) ?? null;
}

export function validateRelease(state, registry, projectRoot) {
  const errors = [];
  const warnings = [];

  if (!Number.isInteger(state.current_day)) {
    errors.push("current_day must be an integer.");
  }

  if (state.current_day < 1 || state.current_day > 100) {
    errors.push(
      `current_day must be between 1 and 100. Got: ${state.current_day}`
    );
  }

  const validStatuses = [
    "not_ready",
    "ready",
    "validating",
    "testing",
    "building",
    "pushing",
    "deploying",
    "verifying",
    "released",
    "failed"
  ];

  if (!validStatuses.includes(state.status)) {
    errors.push(`Unknown release status: ${state.status}`);
  }

  if (!registry || !Array.isArray(registry.agents)) {
    errors.push("Registry agents must be an array.");
    return { valid: false, errors, warnings, agent: null };
  }

  const agent = findAgentForDay(registry, state.current_day);

  if (!agent) {
    errors.push(`No agent is registered for Day ${state.current_day}.`);
  }

  if (agent && agent.status === "released") {
    warnings.push(
      `Agent ${agent.agent_id} is already marked released. Duplicate release must be prevented.`
    );
  }

  if (state.status !== "ready") {
    warnings.push(
      `Day ${state.current_day} is currently "${state.status}". No deployment will occur.`
    );
  }

  const registryPath = path.join(projectRoot, "registry", "agents.json");

  if (!fs.existsSync(registryPath)) {
    errors.push(`Registry file does not exist: ${registryPath}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    agent
  };
}
