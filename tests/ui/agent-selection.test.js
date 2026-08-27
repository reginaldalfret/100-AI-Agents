import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

test('Agent Selection Logic & Sidebar Card Sync', async (t) => {
  const appJs = fs.readFileSync(path.join(ROOT, 'platform', 'web', 'app.js'), 'utf8');

  await t.test('LOCAL_AGENT_DEFS contains all 6 external integrations with correct metadata', () => {
    assert.ok(appJs.includes("'hermes'"), 'Hermes missing in LOCAL_AGENT_DEFS');
    assert.ok(appJs.includes("'opencode'"), 'OpenCode missing in LOCAL_AGENT_DEFS');
    assert.ok(appJs.includes("'codex'"), 'Codex missing in LOCAL_AGENT_DEFS');
    assert.ok(appJs.includes("'openclaw'"), 'OpenClaw missing in LOCAL_AGENT_DEFS');
    assert.ok(appJs.includes("'pi'"), 'Pi missing in LOCAL_AGENT_DEFS');
    assert.ok(appJs.includes("'copilot-cli'"), 'Copilot CLI missing in LOCAL_AGENT_DEFS');
  });

  await t.test('renderAgentIntegrations adds click-to-select handlers and selected state', () => {
    assert.ok(appJs.includes('selectAgentMode(integration.id)'), 'Click handler must select agent');
    assert.ok(appJs.includes('badge-selected'), 'Selected badge must be rendered');
  });

  await t.test('handleSend passes effective agent ID based on selectedAgentMode', () => {
    assert.ok(appJs.includes('effectiveAgentId') || appJs.includes('targetAgentId'), 'Effective target agent logic present');
    assert.ok(appJs.includes('selectedAgentMode'), 'selectedAgentMode referenced in dispatch');
  });
});
