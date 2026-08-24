import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ProcessManager } from '../../desktop/main/process-manager.js';
import { DesktopConfig } from '../../desktop/main/config.js';

describe('Desktop Process Manager & Port Discovery', () => {
  it('resolves binary paths safely with development fallback', () => {
    const nodeBin = ProcessManager.resolveBinary('node');
    assert.ok(nodeBin);
    assert.ok(typeof nodeBin === 'string');
  });

  it('probes network ports accurately on loopback', async () => {
    const is8300Open = await ProcessManager.isPortOpen(DesktopConfig.ports.gateway);
    assert.ok(typeof is8300Open === 'boolean');
  });

  it('detects port owners gracefully without throwing', () => {
    const owner = ProcessManager.getPortOwner(DesktopConfig.ports.gateway);
    if (owner) {
      assert.ok(owner.pid > 0);
      assert.ok(typeof owner.name === 'string');
    }
  });
});
