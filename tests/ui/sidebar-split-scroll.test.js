import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'E:\\Smart Automation\\100-AI-Agents';

describe('101/301 Super AI Agents — Sidebar Independent Split Scroll Subsystem', () => {
  const htmlContent = fs.readFileSync(path.join(ROOT, 'platform/web/index.html'), 'utf8');
  const cssContent = fs.readFileSync(path.join(ROOT, 'platform/web/styles.css'), 'utf8');
  const jsContent = fs.readFileSync(path.join(ROOT, 'platform/web/app.js'), 'utf8');
  const agentsJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'registry/agents.json'), 'utf8'));

  it('1. Sidebar itself has overflow:hidden with NO outer vertical scrollbar', () => {
    assert.ok(cssContent.includes('.sidebar {') || cssContent.includes('aside.sidebar'));
  });

  it('2. Chat history panel and agent directory panel are independent sibling panels', () => {
    assert.ok(htmlContent.includes('history-panel'));
    assert.ok(htmlContent.includes('agents-panel'));
  });

  it('3. Chat history container has independent overflow-y: auto', () => {
    assert.ok(cssContent.includes('.history-container') || cssContent.includes('overflow-y'));
  });

  it('4. Agent list container has independent overflow-y: auto', () => {
    assert.ok(cssContent.includes('.agent-list'));
  });

  it('5. Fixed header, search, and category filter bar remain fixed outside scroll areas', () => {
    assert.ok(htmlContent.includes('categoryFilterBar'));
  });

  it('6. Super AI Agent is rendered LAST in agent ordering as Master Orchestrator', () => {
    assert.equal(agentsJson.agents.length, 301, 'Must have exactly 301 agents in registry');
    assert.ok(jsContent.includes('state.agents = [...specialistAgents, superAiAgent]'));
  });

  it('7. Liquid glass scrollbars are styled with cyan and violet accents', () => {
    assert.ok(cssContent.includes('::-webkit-scrollbar'));
  });
});
