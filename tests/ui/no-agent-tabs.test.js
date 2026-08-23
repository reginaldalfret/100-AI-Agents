/**
 * UI Test Suite: Removal of Agent Workspace Tab Navigation
 * Verifies that the horizontal tab bar (Chat | About | Capabilities | Examples)
 * has been completely removed while maintaining full workspace chat functionality.
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.env.PROJECT_ROOT || 'E:\\Smart Automation\\100-AI-Agents';
const HTML_PATH = path.join(ROOT, 'platform', 'web', 'index.html');
const CSS_PATH = path.join(ROOT, 'platform', 'web', 'styles.css');
const JS_PATH = path.join(ROOT, 'platform', 'web', 'app.js');

test('Tab Navigation Removal — HTML Structure', () => {
  const html = fs.readFileSync(HTML_PATH, 'utf8');

  // 1. Workspace tabs nav bar must be absent
  assert.strictEqual(html.includes('id="workspaceTabs"'), false, 'id="workspaceTabs" must be removed from index.html');
  assert.strictEqual(html.includes('class="workspace-tabs"'), false, 'class="workspace-tabs" must be removed from index.html');

  // 2. Separate obsolete tab view panels must be absent
  assert.strictEqual(html.includes('id="aboutView"'), false, 'id="aboutView" must be removed from index.html');
  assert.strictEqual(html.includes('id="capabilitiesView"'), false, 'id="capabilitiesView" must be removed from index.html');
  assert.strictEqual(html.includes('id="examplesView"'), false, 'id="examplesView" must be removed from index.html');

  // 3. Main chat view must remain active workspace
  assert.ok(html.includes('id="chatView"'), 'id="chatView" must exist in index.html');
  assert.ok(html.includes('id="chatMessages"'), 'id="chatMessages" must exist in index.html');
  assert.ok(html.includes('id="chatInput"'), 'id="chatInput" must exist in index.html');
});

test('Tab Navigation Removal — CSS Styling', () => {
  const css = fs.readFileSync(CSS_PATH, 'utf8');

  // 1. No obsolete .workspace-tabs CSS rules
  assert.strictEqual(css.includes('.workspace-tabs {'), false, '.workspace-tabs rule must be removed from styles.css');
  assert.strictEqual(css.includes('.workspace-tabs button'), false, '.workspace-tabs button rule must be removed from styles.css');
});

test('Tab Navigation Removal — JS Controller State & Routing', () => {
  const js = fs.readFileSync(JS_PATH, 'utf8');

  // 1. No activeTab state or switchTab calls
  assert.strictEqual(js.includes('activeTab:'), false, 'activeTab state must be removed from app.js');
  assert.strictEqual(js.includes('function switchTab('), false, 'function switchTab must be removed from app.js');

  // 2. Main empty state and composer remain fully functional
  assert.ok(js.includes('function showEmptyState('), 'showEmptyState must remain functional in app.js');
  assert.ok(js.includes('function updatePlaceholder('), 'updatePlaceholder must remain functional in app.js');
  assert.ok(js.includes('function handleSend('), 'handleSend must remain functional in app.js');
});
