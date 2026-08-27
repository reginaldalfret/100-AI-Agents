import test from 'node:test';
import assert from 'node:assert/strict';
import { requireConfirmation, isWorkspaceAccessAllowed } from '../../platform/agents/agent-permissions.js';

test('Agent Selection Security & RBAC Policies', async (t) => {
  await t.test('Destructive commands require user confirmation', () => {
    const check1 = requireConfirmation('hermes', 'rm -rf /');
    assert.equal(check1.needsConfirmation, true);

    const check2 = requireConfirmation('opencode', 'DROP TABLE users;');
    assert.equal(check2.needsConfirmation, true);
  });

  await t.test('Workspace isolation blocks path traversal outside agent folder', () => {
    assert.equal(isWorkspaceAccessAllowed('opencode', 'workspace/agents/opencode/main.py'), true);
    assert.equal(isWorkspaceAccessAllowed('opencode', 'C:/Windows/System32/cmd.exe'), false);
    assert.equal(isWorkspaceAccessAllowed('hermes', '../../../etc/passwd'), false);
  });
});
