import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

test('Agent Selector UI Structure & Elements', async (t) => {
  const html = fs.readFileSync(path.join(ROOT, 'platform', 'web', 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'platform', 'web', 'styles.css'), 'utf8');
  const appJs = fs.readFileSync(path.join(ROOT, 'platform', 'web', 'app.js'), 'utf8');

  await t.test('index.html contains #agentSelectorWrapper and #agentSelectorBtn', () => {
    assert.ok(html.includes('id="agentSelectorWrapper"'), 'agentSelectorWrapper missing');
    assert.ok(html.includes('id="agentSelectorBtn"'), 'agentSelectorBtn missing');
    assert.ok(html.includes('id="agentDropdown"'), 'agentDropdown missing');
    assert.ok(html.includes('id="agentSelectorLabel"'), 'agentSelectorLabel missing');
  });

  await t.test('agentDropdown contains all 6 integrated agents + Auto option', () => {
    assert.ok(html.includes('data-agent-id="auto"'), 'Auto option missing');
    assert.ok(html.includes('data-agent-id="hermes"'), 'Hermes option missing');
    assert.ok(html.includes('data-agent-id="opencode"'), 'OpenCode option missing');
    assert.ok(html.includes('data-agent-id="codex"'), 'Codex option missing');
    assert.ok(html.includes('data-agent-id="openclaw"'), 'OpenClaw option missing');
    assert.ok(html.includes('data-agent-id="pi"'), 'Pi option missing');
    assert.ok(html.includes('data-agent-id="copilot-cli"'), 'Copilot CLI option missing');
  });

  await t.test('index.html contains #sessionIndicatorBar with 6 telemetry fields', () => {
    assert.ok(html.includes('id="sessionIndicatorBar"'), 'sessionIndicatorBar missing');
    assert.ok(html.includes('id="sessionActiveAgent"'), 'sessionActiveAgent missing');
    assert.ok(html.includes('id="sessionActiveModel"'), 'sessionActiveModel missing');
    assert.ok(html.includes('id="sessionActiveRuntime"'), 'sessionActiveRuntime missing');
    assert.ok(html.includes('id="sessionActiveHardware"'), 'sessionActiveHardware missing');
    assert.ok(html.includes('id="sessionActiveNetwork"'), 'sessionActiveNetwork missing');
    assert.ok(html.includes('id="sessionActiveCalls"'), 'sessionActiveCalls missing');
  });

  await t.test('styles.css contains required agent dropdown and telemetry styles', () => {
    assert.ok(css.includes('.agent-selector-wrapper'), 'CSS agent-selector-wrapper missing');
    assert.ok(css.includes('.btn-agent-selector'), 'CSS btn-agent-selector missing');
    assert.ok(css.includes('.agent-dropdown-menu'), 'CSS agent-dropdown-menu missing');
    assert.ok(css.includes('.session-indicator-bar'), 'CSS session-indicator-bar missing');
    assert.ok(css.includes('.badge-selected'), 'CSS badge-selected missing');
  });

  await t.test('app.js initializes agent selector with auto as default', () => {
    assert.ok(appJs.includes("selectedAgentMode: 'auto'"), 'Default selectedAgentMode must be auto');
    assert.ok(appJs.includes('initAgentSelector'), 'initAgentSelector function missing');
    assert.ok(appJs.includes('selectAgentMode'), 'selectAgentMode function missing');
  });
});
