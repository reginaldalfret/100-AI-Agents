import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = path.resolve(process.env.PROJECT_ROOT ?? path.join(import.meta.dirname, "../.."));
const REGISTRY_PATH = path.join(PROJECT_ROOT, "registry", "agents.json");

export function getProjectRoot() {
  return PROJECT_ROOT;
}

export function loadRegistry() {
  const raw = fs.readFileSync(REGISTRY_PATH, "utf8");
  const registry = JSON.parse(raw);

  if (!Array.isArray(registry.agents)) {
    throw new Error("registry.agents must be an array");
  }

  return registry;
}

export function getAgents() {
  return loadRegistry().agents;
}

export function getAgent(agentId) {
  return getAgents().find((agent) => agent.agent_id === agentId) ?? null;
}

export function getSummary() {
  const registry = loadRegistry();
  const agents = registry.agents;
  const completed = agents.filter((agent) => agent.status === "released").length;
  const ready = agents.filter((agent) => agent.status === "ready").length;
  const planned = agents.filter((agent) => agent.status === "planned").length;

  return {
    project: registry.project,
    version: registry.version,
    total_agents: registry.total_agents,
    completed_agents: registry.completed_agents ?? completed,
    registered_agents: agents.length,
    ready_agents: ready,
    planned_agents: planned,
    released_agents: completed
  };
}
