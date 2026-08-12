#!/usr/bin/env node
/**
 * Generate local specialist-agent applications from registry/agents.json.
 *
 * Usage:
 *   node scripts/generate-agents.js
 *   node scripts/generate-agents.js --only agent-002
 *   node scripts/generate-agents.js --force
 *
 * The generator never touches an existing agent directory unless --force is
 * explicitly supplied. This protects Agent 001 and other manual work.
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const REGISTRY_PATH = path.join(ROOT, "registry", "agents.json");
const TEMPLATE_ROOT = path.join(ROOT, "agent-template");
const OUTPUT_ROOT = path.join(ROOT, "agents");

const args = new Set(process.argv.slice(2));
const onlyIndex = process.argv.indexOf("--only");
const only = onlyIndex >= 0 ? process.argv[onlyIndex + 1] : null;
const force = args.has("--force");

if (onlyIndex >= 0 && !only) {
  throw new Error("--only requires an agent id, e.g. --only agent-002");
}

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeText(file, content, mode = null) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
  if (mode !== null) fs.chmodSync(file, mode);
}

function copyTemplate(relativePath, destination, replacements) {
  const source = path.join(TEMPLATE_ROOT, relativePath);
  const target = path.join(destination, relativePath);
  let content = fs.readFileSync(source, "utf8");

  for (const [token, value] of Object.entries(replacements)) {
    content = content.split(token).join(value);
  }

  writeText(target, content);
}

function renderAgentConfig(agent) {
  return JSON.stringify({
    day: agent.day,
    agent_id: agent.agent_id,
    name: agent.name,
    slug: agent.slug,
    category: agent.category,
    model: agent.model,
    capabilities: agent.capabilities ?? [],
    ui_type: agent.ui_type ?? "task",
    system_prompt: agent.system_prompt ?? `You are ${agent.name}. Perform the requested task accurately and return useful structured output.`,
    contract: {
      health: "/api/health",
      run: "/api/agent"
    }
  }, null, 2) + "\n";
}

function renderReadme(agent) {
  return `# ${agent.name}\n\n` +
    `Day: ${agent.day}\n\n` +
    `Agent ID: ${agent.agent_id}\n\n` +
    `Category: ${agent.category}\n\n` +
    `This agent is generated from the 100-to-1 shared runtime. Its external API contract remains standardized while its system prompt, capabilities and UI configuration are agent-specific.\n\n` +
    `## API\n\n` +
    `- GET /api/health\n` +
    `- GET /api/info\n` +
    `- POST /api/agent\n`;
}

function renderPackage(agent) {
  return JSON.stringify({
    name: agent.agent_id,
    version: "1.0.0",
    private: true,
    type: "module",
    scripts: {
      start: "node backend/src/server.js",
      check: "node --check backend/src/server.js && node --check backend/src/agent.js && node --check backend/src/config.js && node --check backend/src/model.js",
      test: "node --test tests/contract.test.js"
    },
    engines: { node: ">=20" }
  }, null, 2) + "\n";
}

function generate(agent) {
  if (agent.day === 1 && !force) {
    console.log(`SKIP ${agent.agent_id}: existing Day 1 agent is protected`);
    return "skipped";
  }

  const destination = path.join(OUTPUT_ROOT, `${agent.agent_id}-${agent.slug}`);
  if (fs.existsSync(destination) && !force) {
    console.log(`SKIP ${agent.agent_id}: directory exists`);
    return "skipped";
  }

  if (force && fs.existsSync(destination)) {
    fs.rmSync(destination, { recursive: true, force: true });
  }

  const replacements = {
    "__AGENT_ID__": agent.agent_id,
    "__AGENT_NAME__": agent.name,
    "__AGENT_VERSION__": "1.0.0",
    "__AGENT_SYSTEM_PROMPT__": agent.system_prompt ?? `You are ${agent.name}. Perform the requested task accurately and return useful structured output.`,
    "__MODEL__": agent.model ?? "qwen3.5:9b",
    "__OLLAMA_URL__": agent.backend ?? "http://127.0.0.1:11435"
  };

  fs.mkdirSync(destination, { recursive: true });

  const files = [
    "backend/src/server.js",
    "backend/src/agent.js",
    "backend/src/config.js",
    "backend/src/model.js",
    "frontend/index.html",
    "tests/contract.test.js"
  ];

  for (const file of files) copyTemplate(file, destination, replacements);

  writeText(path.join(destination, "agent.json"), renderAgentConfig(agent));
  writeText(path.join(destination, "README.md"), renderReadme(agent));
  writeText(path.join(destination, "package.json"), renderPackage(agent));

  console.log(`GENERATED ${agent.agent_id}: ${destination}`);
  return "generated";
}

const registry = loadJson(REGISTRY_PATH);
if (!Array.isArray(registry.agents) || registry.agents.length !== registry.total_agents) {
  throw new Error(`Registry mismatch: ${registry.agents?.length ?? 0} entries for ${registry.total_agents} agents.`);
}

const selected = only
  ? registry.agents.filter((agent) => agent.agent_id === only)
  : registry.agents;

if (only && selected.length === 0) {
  throw new Error(`Unknown agent: ${only}`);
}

fs.mkdirSync(OUTPUT_ROOT, { recursive: true });

let generated = 0;
let skipped = 0;
for (const agent of selected) {
  if (generate(agent) === "generated") generated += 1;
  else skipped += 1;
}

console.log(`\nGeneration complete: generated=${generated}, skipped=${skipped}, selected=${selected.length}`);
