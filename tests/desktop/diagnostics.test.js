import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SystemDiagnostics } from '../../desktop/main/diagnostics.js';

describe('Desktop System Diagnostics & Hardware Probing', () => {
  it('gathers CPU, RAM, and OS hardware profile dynamically', () => {
    const hw = SystemDiagnostics.getHardwareInfo();
    assert.ok(hw.cpu.cores > 0);
    assert.ok(hw.ram.totalGb > 0);
    assert.ok(hw.os.platform);
  });

  it('generates full sovereign workstation diagnostic report', async () => {
    const report = await SystemDiagnostics.generateReport();
    assert.ok(report.app);
    assert.equal(report.app.airGapped, true);
    assert.equal(report.app.externalEgress, 0);
    assert.ok(report.health);
  });
});
