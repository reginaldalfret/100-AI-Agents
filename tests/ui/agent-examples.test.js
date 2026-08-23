/**
 * Test Suite: 101 Super AI Agents — Agent-Specific Empty States & Examples Verification
 * Verifies all 101 agents have authentic, role-aligned, capability-specific example prompts,
 * dynamic empty state descriptions, dynamic composer placeholders, and absence of stale cross-agent fallbacks.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

describe('101 Super AI Agents — Agent-Specific Examples & Empty States Subsystem', () => {
  const sihMappingPath = path.join(ROOT, 'registry', 'sih-agent-mapping.json');
  const sihAgents = JSON.parse(fs.readFileSync(sihMappingPath, 'utf8'));

  const agentsJsonPath = path.join(ROOT, 'registry', 'agents.json');
  const agentsJson = JSON.parse(fs.readFileSync(agentsJsonPath, 'utf8'));

  const appJs = fs.readFileSync(path.join(ROOT, 'platform/web/app.js'), 'utf8');

  it('1. All 101 agents in registry have 3–5 non-empty example prompts', () => {
    assert.equal(sihAgents.length, 101, 'Must have exactly 101 agents in mapping');
    assert.equal(agentsJson.agents.length, 101, 'Must have exactly 101 agents in agents.json');

    sihAgents.forEach((agent, i) => {
      const num = String(agent.displayNumber || agent.day || (i + 1)).padStart(3, '0');
      assert.ok(Array.isArray(agent.examples), `Agent ${num} (${agent.name}) must have examples array`);
      assert.ok(
        agent.examples.length >= 3 && agent.examples.length <= 5,
        `Agent ${num} (${agent.name}) must have 3-5 examples, got ${agent.examples.length}`
      );
      agent.examples.forEach((ex, exIdx) => {
        assert.ok(typeof ex === 'string', `Agent ${num} example ${exIdx} must be string`);
        assert.ok(ex.trim().length >= 10, `Agent ${num} example ${exIdx} must be non-trivial (>10 chars)`);
      });
    });
  });

  it('2. 003 Study AI Agent has authentic study prompts with ZERO programming artifacts', () => {
    const studyAgent = sihAgents.find(a => a.displayNumber === '003' || a.name.includes('Study'));
    assert.ok(studyAgent, 'Study AI Agent must exist in registry');
    
    assert.ok(
      studyAgent.description.toLowerCase().includes('study') ||
      studyAgent.description.toLowerCase().includes('flashcard') ||
      studyAgent.description.toLowerCase().includes('learn'),
      `Study Agent description must be learning-focused: ${studyAgent.description}`
    );

    const examplesCombined = studyAgent.examples.join(' ').toLowerCase();
    assert.ok(
      examplesCombined.includes('study') || examplesCombined.includes('exam') || examplesCombined.includes('flashcard'),
      `Study Agent examples must contain study keywords: ${examplesCombined}`
    );

    // Negative assertions: NO REST API, binary search, Node.js
    assert.ok(!examplesCombined.includes('rest api'), 'Study Agent must NOT have REST API examples');
    assert.ok(!examplesCombined.includes('node.js'), 'Study Agent must NOT have Node.js examples');
    assert.ok(!examplesCombined.includes('binary search'), 'Study Agent must NOT have binary search examples');
  });

  it('3. 001 Writing AI Agent and 002 Email AI Agent have authentic communication prompts', () => {
    const writingAgent = sihAgents.find(a => a.displayNumber === '001');
    assert.ok(writingAgent, 'Writing AI Agent must exist');
    const writingEx = writingAgent.examples.join(' ').toLowerCase();
    assert.ok(writingEx.includes('article') || writingEx.includes('draft') || writingEx.includes('polish'));

    const emailAgent = sihAgents.find(a => a.displayNumber === '002');
    assert.ok(emailAgent, 'Email AI Agent must exist');
    const emailEx = emailAgent.examples.join(' ').toLowerCase();
    assert.ok(emailEx.includes('email') || emailEx.includes('reply') || emailEx.includes('manager'));
  });

  it('4. 051 Image Analysis AI Agent and 061 Code Generation AI Agent have authentic domain prompts', () => {
    const imgAgent = sihAgents.find(a => a.displayNumber === '051');
    assert.ok(imgAgent, 'Image Analysis AI Agent must exist');
    const imgEx = imgAgent.examples.join(' ').toLowerCase();
    assert.ok(imgEx.includes('photo') || imgEx.includes('image') || imgEx.includes('corrosion') || imgEx.includes('visual'));

    const codeAgent = sihAgents.find(a => a.displayNumber === '061');
    assert.ok(codeAgent, 'Code Generation AI Agent must exist');
    const codeEx = codeAgent.examples.join(' ').toLowerCase();
    assert.ok(codeEx.includes('python') || codeEx.includes('cache') || codeEx.includes('crud') || codeEx.includes('code'));
  });

  it('5. 101 Super AI Agent has multi-agent orchestration prompts', () => {
    const superAgent = sihAgents.find(a => a.displayNumber === '101' || a.id === 'agent-101');
    assert.ok(superAgent, 'Super AI Agent must exist in registry');
    const superEx = superAgent.examples.join(' ').toLowerCase();
    assert.ok(
      superEx.includes('full-stack') || superEx.includes('investigation') || superEx.includes('coordinate') || superEx.includes('agents'),
      `Super AI Agent examples must be orchestration-oriented: ${superEx}`
    );
  });

  it('6. Frontend app.js loads examples directly from agent profile with safe fallback', () => {
    assert.ok(appJs.includes('function getAgentExamples(agent)'), 'app.js must define getAgentExamples');
    assert.ok(appJs.includes("['No example prompts available yet.']"), 'app.js must define clean empty fallback without cross-agent pollution');
    assert.ok(appJs.includes('window.useExamplePrompt'), 'app.js must expose useExamplePrompt');
  });

  it('7. Frontend app.js dynamically updates empty state and placeholder on agent switch', () => {
    assert.ok(appJs.includes('updatePlaceholder(agent)'), 'app.js must call updatePlaceholder');
    assert.ok(appJs.includes('Ask the ${name}...') || appJs.includes('Message ${agent'), 'app.js must format dynamic placeholder');
    assert.ok(appJs.includes('showEmptyState(agent)'), 'app.js must pass selected agent to showEmptyState');
    assert.ok(appJs.includes('getAgentExamples(agent)'), 'app.js must retrieve examples for selected agent');
  });
});
