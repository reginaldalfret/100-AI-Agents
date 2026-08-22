import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const mappingPath = path.join(ROOT_DIR, "registry", "sa-s03-agent-mapping.json");
const registryPath = path.join(ROOT_DIR, "registry", "agents.json");

const mapping = JSON.parse(fs.readFileSync(mappingPath, "utf8"));
const existingRegistry = JSON.parse(fs.readFileSync(registryPath, "utf8"));

const enrichedAgents = existingRegistry.agents.map(agent => {
  const mapItem = mapping.agents.find(m => m.agent_id === agent.agent_id);
  if (!mapItem) return agent;

  return {
    ...agent,
    educational_name: mapItem.educational_name,
    educational_domain: mapItem.educational_domain,
    domain_name: mapItem.domain_name,
    classification: mapItem.classification,
    allowed_tools: mapItem.allowed_tools,
    workflow_roles: mapItem.workflow_roles,
    model: "nemotron-3-nano"
  };
});

fs.writeFileSync(registryPath, JSON.stringify({
  version: "2.0.0",
  updated_at: new Date().toISOString(),
  platform: "SA-S03 Educational Intelligent Workflow Management",
  total_agents: enrichedAgents.length,
  agents: enrichedAgents
}, null, 2), "utf8");

console.log(`Successfully synced and enriched ${enrichedAgents.length} agents in ${registryPath}`);
