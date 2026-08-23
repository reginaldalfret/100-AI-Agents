import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'E:\\Smart Automation\\100-AI-Agents';

describe('301 Super AI Agents — Agent Taxonomy & Ordering Test', () => {
  const sihMappingPath = path.join(ROOT, 'registry', 'sih-agent-mapping.json');
  const sihAgents = JSON.parse(fs.readFileSync(sihMappingPath, 'utf8'));

  const agentsJsonPath = path.join(ROOT, 'registry', 'agents.json');
  const agentsJson = JSON.parse(fs.readFileSync(agentsJsonPath, 'utf8'));

  it('should have exactly 301 registered agents', () => {
    assert.equal(sihAgents.length, 301, `Expected 301 agents in sih-agent-mapping.json, got ${sihAgents.length}`);
    assert.equal(agentsJson.agents.length, 301, `Expected 301 agents in agents.json, got ${agentsJson.agents.length}`);
  });

  it('should have unique display numbers 001 through 301 without gaps or duplicates', () => {
    const seenNumbers = new Set();
    for (let i = 1; i <= 301; i++) {
      const expectedNum = String(i).padStart(3, '0');
      const agent = sihAgents.find(a => a.displayNumber === expectedNum || a.day === i);
      assert.ok(agent, `Missing agent for number ${expectedNum}`);
      assert.ok(!seenNumbers.has(expectedNum), `Duplicate agent number found: ${expectedNum}`);
      seenNumbers.add(expectedNum);
    }
    assert.equal(seenNumbers.size, 301);
  });

  it('should have all specialist agents 001-301 named with "AI Agent"', () => {
    for (let i = 1; i <= 301; i++) {
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

  it('should verify UI app.js places Super AI Agent LAST as Master Orchestrator in visible ordering', () => {
    const appJsContent = fs.readFileSync(path.join(ROOT, 'platform', 'web', 'app.js'), 'utf8');
    assert.ok(
      appJsContent.includes('state.agents = [...specialistAgents, superAiAgent]'),
      'app.js must place superAiAgent LAST after all specialistAgents'
    );
  });
});
