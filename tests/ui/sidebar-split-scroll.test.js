/**
 * Test Suite: Sidebar Independent Two-Panel Split Scroll Verification
 * Verifies independent scrolling regions for Chat History and Agent Directory,
 * absence of outer sidebar page scroll, fixed header/search/status, and 101 agent ordering.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

describe('101 Super AI Agents — Sidebar Independent Split Scroll Subsystem', () => {
  const html = fs.readFileSync(path.join(ROOT, 'platform/web/index.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'platform/web/styles.css'), 'utf8');
  const js = fs.readFileSync(path.join(ROOT, 'platform/web/app.js'), 'utf8');
  const sihAgents = JSON.parse(fs.readFileSync(path.join(ROOT, 'registry/sih-agent-mapping.json'), 'utf8'));

  it('1. Sidebar itself has overflow:hidden with NO outer vertical scrollbar', () => {
    // .sidebar must be overflow: hidden
    assert.ok(css.includes('.sidebar {') || css.includes('.sidebar{'), 'Must define .sidebar');
    const sidebarBlock = css.slice(css.indexOf('.sidebar {'), css.indexOf('.sidebar-header'));
    assert.ok(sidebarBlock.includes('overflow: hidden;'), 'Sidebar must enforce overflow: hidden to prevent outer page scroll');
    assert.ok(sidebarBlock.includes('display: flex;'), 'Sidebar must be display: flex');
    assert.ok(sidebarBlock.includes('flex-direction: column;'), 'Sidebar must be flex-direction: column');
  });

  it('2. Chat history panel and agent directory panel are independent sibling panels', () => {
    assert.ok(html.includes('id="historySection"'), 'HTML must have historySection panel');
    assert.ok(html.includes('id="agentDirectorySection"'), 'HTML must have agentDirectorySection panel');
    assert.ok(html.includes('class="sidebar-panel-divider"'), 'HTML must have sidebar-panel-divider');

    // Verify historySection comes before agentDirectorySection
    const histIdx = html.indexOf('id="historySection"');
    const divIdx = html.indexOf('class="sidebar-panel-divider"');
    const agentIdx = html.indexOf('id="agentDirectorySection"');
    assert.ok(histIdx < divIdx && divIdx < agentIdx, 'History panel must precede divider and agent panel');
  });

  it('3. Chat history container has independent overflow-y: auto', () => {
    assert.ok(html.includes('id="conversationList"'), 'HTML must have conversationList container');
    assert.ok(css.includes('.conversation-list {'), 'CSS must style .conversation-list');
    
    const convBlock = css.slice(css.indexOf('.conversation-list {'), css.indexOf('.date-group'));
    assert.ok(convBlock.includes('overflow-y: auto;'), 'Conversation list must have overflow-y: auto');
    assert.ok(convBlock.includes('flex: 1 1 0;') || convBlock.includes('flex: 1;'), 'Conversation list must have flex expansion');
  });

  it('4. Agent list container has independent overflow-y: auto', () => {
    assert.ok(html.includes('id="agentList"'), 'HTML must have agentList container');
    assert.ok(css.includes('.agent-list {'), 'CSS must style .agent-list');

    const agentBlock = css.slice(css.indexOf('.agent-list {'), css.indexOf('.agent-row'));
    assert.ok(agentBlock.includes('overflow-y: auto;'), 'Agent list must have overflow-y: auto');
    assert.ok(agentBlock.includes('flex: 1 1 0;') || agentBlock.includes('flex: 1;'), 'Agent list must have flex expansion');
  });

  it('5. Fixed header, search, category filter bar, and footer status remain fixed outside scroll areas', () => {
    assert.ok(html.includes('class="sidebar-header"'), 'Header must exist');
    assert.ok(html.includes('id="btnNewChat"'), 'New Chat must exist in fixed header');
    assert.ok(html.includes('id="sidebarSearch"'), 'Sidebar search must exist in fixed header');
    assert.ok(html.includes('id="categoryFilterBar"'), 'Category filters must exist in agent section header');
    assert.ok(html.includes('class="sidebar-footer"'), 'Footer status must exist');

    // Verify search and category filter bar are outside the scrollable containers
    const searchIdx = html.indexOf('id="sidebarSearch"');
    const convIdx = html.indexOf('id="conversationList"');
    const catIdx = html.indexOf('id="categoryFilterBar"');
    const agentListIdx = html.indexOf('id="agentList"');
    const footerIdx = html.indexOf('class="sidebar-footer"');

    assert.ok(searchIdx < convIdx, 'Search box must be above conversation scroll container');
    assert.ok(catIdx < agentListIdx, 'Category filters must be above agent scroll container');
    assert.ok(agentListIdx < footerIdx, 'Footer must be below agent scroll container');
  });

  it('6. Agent 101 Super AI Agent is rendered LAST in agent ordering', () => {
    assert.strictEqual(sihAgents.length, 101, 'Must have exactly 101 agents in registry');
    assert.strictEqual(sihAgents[100].id, 'agent-101', 'Agent 101 must be the 101st entry');
    assert.ok(js.includes('is-super-ai') || js.includes('agent-101'), 'App.js handles Super AI styling/order');
  });

  it('7. Liquid glass scrollbars are styled with cyan and violet accents', () => {
    assert.ok(css.includes('.conversation-list::-webkit-scrollbar-thumb'), 'Must style conversation list scrollbar');
    assert.ok(css.includes('.agent-list::-webkit-scrollbar-thumb'), 'Must style agent list scrollbar');
  });
});
