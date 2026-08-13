import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "../../../..");
const REGISTRY_PATH = path.join(ROOT, "registry", "agents.json");

function loadRegistry() {
  return JSON.parse(
    fs.readFileSync(REGISTRY_PATH, "utf8")
  );
}

export function getAllAgents() {
  return loadRegistry().agents;
}

export function getAgent(agentId) {
  return getAllAgents().find(
    agent => agent.agent_id === agentId
  ) || null;
}

export function getSpecialists() {
  return getAllAgents().filter(
    agent =>
      agent.agent_id !== "agent-101" &&
      agent.status !== "disabled"
  );
}

export function registrySummary() {
  const agents = getAllAgents();

  return {
    total: agents.length,

    categories: agents.reduce((result, agent) => {
      result[agent.category] =
        (result[agent.category] || 0) + 1;
      return result;
    }, {}),

    statuses: agents.reduce((result, agent) => {
      result[agent.status] =
        (result[agent.status] || 0) + 1;
      return result;
    }, {})
  };
}
