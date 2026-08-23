import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

test('301 Workforce Registry Integrity', async (t) => {
  const agentsPath = path.join(ROOT, 'registry/agents.json');
  const sihPath = path.join(ROOT, 'registry/sih-agent-mapping.json');

  assert.ok(fs.existsSync(agentsPath), 'registry/agents.json must exist');
  assert.ok(fs.existsSync(sihPath), 'registry/sih-agent-mapping.json must exist');

  const agentsData = JSON.parse(fs.readFileSync(agentsPath, 'utf8'));
  const sihData = JSON.parse(fs.readFileSync(sihPath, 'utf8'));

  const agents = agentsData.agents || [];

  await t.test('exact count is 301 agents in both registries', () => {
    assert.equal(agents.length, 301, 'agents.json must have exactly 301 agents');
    assert.equal(sihData.length, 301, 'sih-agent-mapping.json must have exactly 301 agents');
  });

  await t.test('baseline agents #001–#100 are preserved and locked', () => {
    for (let i = 0; i < 100; i++) {
      const a = agents[i];
      const expectedNum = String(i + 1).padStart(3, '0');
      assert.equal(a.agent_id, `agent-${expectedNum}`, `Agent at index ${i} must have ID agent-${expectedNum}`);
      assert.ok(a.name, `Baseline agent ${a.agent_id} must have a name`);
      assert.ok(a.category, `Baseline agent ${a.agent_id} must have a category`);
    }
  });

  await t.test('new specialist agents #101–#301 have complete metadata and unique IDs', () => {
    const seenIds = new Set();
    for (let i = 100; i < 301; i++) {
      const a = agents[i];
      const expectedNum = String(i + 1).padStart(3, '0');
      assert.equal(a.agent_id, `agent-${expectedNum}`, `Specialist at index ${i} must have ID agent-${expectedNum}`);
      assert.ok(!seenIds.has(a.agent_id), `Agent ID ${a.agent_id} must be unique`);
      seenIds.add(a.agent_id);

      assert.ok(a.name && a.name.length > 3, `Specialist ${a.agent_id} must have a descriptive name`);
      assert.ok(a.domain, `Specialist ${a.agent_id} must have a domain`);
      assert.ok(a.description, `Specialist ${a.agent_id} must have a description`);
      assert.ok(Array.isArray(a.capabilities) && a.capabilities.length >= 3, `Specialist ${a.agent_id} must have >= 3 capabilities`);
      assert.ok(Array.isArray(a.allowed_operations), `Specialist ${a.agent_id} must have allowed_operations`);
      assert.ok(Array.isArray(a.forbidden_operations), `Specialist ${a.agent_id} must have forbidden_operations`);
      assert.ok(a.risk_level, `Specialist ${a.agent_id} must have a risk_level`);
      assert.ok(Array.isArray(a.trigger_conditions) && a.trigger_conditions.length > 0, `Specialist ${a.agent_id} must have triggers`);
    }
  });

  await t.test('all 11 technical specialist domains are represented in #101-#301', () => {
    // 1. Language: 101-130
    assert.equal(agents[100].name, 'Python AsyncIO AI Agent');
    assert.equal(agents[110].name, 'C Memory Management AI Agent');
    assert.equal(agents[121].name, 'Rust Ownership AI Agent');

    // 2. JS/TS: 131-145
    assert.equal(agents[130].name, 'JavaScript Runtime AI Agent');
    assert.equal(agents[133].name, 'TypeScript Advanced Types AI Agent');
    assert.equal(agents[141].name, 'pnpm AI Agent');

    // 3. Frontend: 146-165
    assert.equal(agents[145].name, 'React Server Components AI Agent');
    assert.equal(agents[149].name, 'Next.js App Router AI Agent');
    assert.equal(agents[160].name, 'Web Performance AI Agent');

    // 4. Backend/Arch: 166-180
    assert.equal(agents[165].name, 'API Versioning AI Agent');
    assert.equal(agents[174].name, 'Domain Driven Design AI Agent');
    assert.equal(agents[175].name, 'Clean Architecture AI Agent');

    // 5. Database: 181-200
    assert.equal(agents[180].name, 'PostgreSQL Performance AI Agent');
    assert.equal(agents[188].name, 'PostgreSQL Locking AI Agent');
    assert.equal(agents[189].name, 'PostgreSQL Deadlock AI Agent');

    // 6. Cloud/AWS: 201-220
    assert.equal(agents[200].name, 'AWS EC2 AI Agent');
    assert.equal(agents[204].name, 'AWS RDS AI Agent');
    assert.equal(agents[219].name, 'Cloud Cost Optimization AI Agent');

    // 7. Docker/K8s/DevOps: 221-240
    assert.equal(agents[220].name, 'Docker Networking AI Agent');
    assert.equal(agents[228].name, 'Kubernetes Security AI Agent');
    assert.equal(agents[235].name, 'GitHub Actions AI Agent');

    // 8. AI/ML: 241-260
    assert.equal(agents[240].name, 'LLM Fine-Tuning AI Agent');
    assert.equal(agents[246].name, 'RAG Retrieval AI Agent');
    assert.equal(agents[253].name, 'Multi-Agent Systems AI Agent');

    // 9. Cybersecurity: 261-275
    assert.equal(agents[260].name, 'Zero Trust AI Agent');
    assert.equal(agents[264].name, 'SQL Injection Security AI Agent');
    assert.equal(agents[271].name, 'JWT Security AI Agent');

    // 10. Testing/Quality: 276-290
    assert.equal(agents[275].name, 'Test Flakiness AI Agent');
    assert.equal(agents[277].name, 'Test Parallelization AI Agent');
    assert.equal(agents[289].name, 'Refactoring AI Agent');

    // 11. Engineering/Release: 291-301
    assert.equal(agents[290].name, 'Repository Architecture AI Agent');
    assert.equal(agents[291].name, 'Monorepo Architecture AI Agent');
    assert.equal(agents[300].name, 'Engineering Workflow AI Agent');
  });
});
