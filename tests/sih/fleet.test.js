import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runTestSuite } from "./harness.js";
import assert from "node:assert";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

await runTestSuite("101-Agent Industrial Workforce Fleet Verification", [
  {
    name: "Verifies all 101 agents in registry/sih-agent-mapping.json",
    fn: async () => {
      const filePath = path.join(ROOT, "registry", "sih-agent-mapping.json");
      assert.ok(fs.existsSync(filePath), "sih-agent-mapping.json must exist");
      const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const agents = Array.isArray(raw) ? raw : (raw.agents || []);
      
      assert.strictEqual(agents.length, 101, "Fleet must contain exactly 101 agents");

      for (const agent of agents) {
        const id = agent.agent_id || agent.id;
        assert.ok(id, "Agent must have an ID");
        assert.ok(agent.name, `Agent ${id} must have a name`);
        assert.ok(agent.domain, `Agent ${id} must have a domain`);
        assert.ok(agent.system_prompt, `Agent ${id} must have a system prompt`);
        assert.ok(Array.isArray(agent.capabilities), `Agent ${id} must have capabilities`);
        assert.ok(agent.capabilities.includes("sovereign-local"), `Agent ${id} must be sovereign local`);
      }
    }
  },
  {
    name: "Confirms Agent 101 is Sovereign Orchestrator",
    fn: async () => {
      const raw = JSON.parse(fs.readFileSync(path.join(ROOT, "registry", "sih-agent-mapping.json"), "utf8"));
      const agents = Array.isArray(raw) ? raw : (raw.agents || []);
      const a101 = agents.find(a => (a.agent_id || a.id) === "agent-101");
      assert.ok(a101);
      assert.ok(a101.name.includes("Sovereign Orchestrator"));
      assert.strictEqual(a101.domain, "Sovereign Orchestration");
    }
  }
]);
