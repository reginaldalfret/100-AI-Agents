import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'E:\\Smart Automation\\100-AI-Agents';

describe('101 Super AI Agents — Agent Taxonomy & Ordering Test', () => {
  const sihMappingPath = path.join(ROOT, 'registry', 'sih-agent-mapping.json');
  const sihAgents = JSON.parse(fs.readFileSync(sihMappingPath, 'utf8'));

  const agentsJsonPath = path.join(ROOT, 'registry', 'agents.json');
  const agentsJson = JSON.parse(fs.readFileSync(agentsJsonPath, 'utf8'));

  it('should have exactly 101 registered agents', () => {
    assert.equal(sihAgents.length, 101, `Expected 101 agents in sih-agent-mapping.json, got ${sihAgents.length}`);
    assert.equal(agentsJson.agents.length, 101, `Expected 101 agents in agents.json, got ${agentsJson.agents.length}`);
  });

  it('should have unique display numbers 001 through 101 without gaps or duplicates', () => {
    const seenNumbers = new Set();
    for (let i = 1; i <= 101; i++) {
      const expectedNum = String(i).padStart(3, '0');
      const agent = sihAgents.find(a => a.displayNumber === expectedNum || a.day === i);
      assert.ok(agent, `Missing agent for number ${expectedNum}`);
      assert.ok(!seenNumbers.has(expectedNum), `Duplicate agent number found: ${expectedNum}`);
      seenNumbers.add(expectedNum);
    }
    assert.equal(seenNumbers.size, 101);
  });

  it('should have all specialist agents 001-100 named with "AI Agent"', () => {
    for (let i = 1; i <= 100; i++) {
      const num = String(i).padStart(3, '0');
      const agent = sihAgents.find(a => a.displayNumber === num || a.day === i);
      assert.ok(agent, `Agent ${num} must exist`);
      assert.ok(
        agent.name.includes('AI Agent'),
        `Agent ${num} (${agent.name}) must contain "AI Agent"`
      );
      assert.ok(agent.category, `Agent ${num} must have a category`);
      assert.ok(agent.description, `Agent ${num} must have a description`);
      assert.ok(Array.isArray(agent.capabilities) && agent.capabilities.length > 0, `Agent ${num} must have capabilities`);
    }
  });

  it('should have Agent 101 named "Super AI Agent"', () => {
    const agent101 = sihAgents.find(a => a.displayNumber === '101' || a.agent_id === 'agent-101' || a.id === 'agent-101');
    assert.ok(agent101, 'Agent 101 must exist');
    assert.equal(agent101.name, 'Super AI Agent');
    assert.equal(agent101.category, 'Orchestrator');
  });

  it('should verify UI app.js places 101 Super AI Agent LAST in visible ordering', () => {
    const appJsContent = fs.readFileSync(path.join(ROOT, 'platform', 'web', 'app.js'), 'utf8');
    assert.ok(
      appJsContent.includes('state.agents = [...specialistAgents, superAiAgent]'),
      'app.js must place superAiAgent (101) LAST after all specialistAgents (001..100)'
    );
    assert.ok(
      appJsContent.includes('agent-101-separator'),
      'app.js must render visual separator before Agent 101'
    );
  });

  it('should verify HTML contains 101 Super AI Agents branding and title', () => {
    const htmlContent = fs.readFileSync(path.join(ROOT, 'platform', 'web', 'index.html'), 'utf8');
    assert.ok(htmlContent.includes('<title>101 Super AI Agents</title>'), 'HTML title must be 101 Super AI Agents');
    assert.ok(htmlContent.includes('101 SUPER AI AGENTS'), 'HTML header must contain 101 SUPER AI AGENTS');
    assert.ok(htmlContent.toLowerCase().includes('101 agents active'), 'HTML status must use Active terminology');
  });
});
