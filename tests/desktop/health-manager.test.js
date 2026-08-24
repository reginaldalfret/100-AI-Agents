import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HealthManager } from '../../desktop/main/health-manager.js';

describe('Desktop Health Manager & Air-Gap Validator', () => {
  it('retrieves aggregated multi-tier health status', async () => {
    const health = await HealthManager.getFullHealth();
    assert.ok(health);
    assert.ok(['READY', 'DEGRADED', 'STARTING'].includes(health.status));
    assert.ok(health.services);
    assert.ok(health.services.airGap.enforced);
    assert.equal(health.services.airGap.externalCalls, 0);
    assert.equal(health.services.visuals.supportedTypes, 24);
  });

  it('validates HTTP endpoints with timeout handling', async () => {
    const res = await HealthManager.checkHttp('http://127.0.0.1:8300/api/health', 1000);
    assert.ok(typeof res.ok === 'boolean');
  });
});
