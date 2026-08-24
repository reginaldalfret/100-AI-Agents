import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PreflightChecks } from '../../desktop/installer/checks.js';

describe('Desktop Canonical Model Manifest & Preflight', () => {
  it('validates canonical model manifest integrity', () => {
    const res = PreflightChecks.verifyModelsManifest();
    assert.equal(res.valid, true);
    assert.ok(res.totalModels >= 5);
    assert.ok(res.requiredCount >= 4);

    const ids = res.models.map(m => m.id);
    assert.ok(ids.includes('nemotron-3-nano:latest'));
    assert.ok(ids.includes('qwen2.5-coder:1.5b'));
    assert.ok(ids.includes('gemma3:4b'));
    assert.ok(ids.includes('whisper-tiny.en'));
  });

  it('confirms strict zero external egress policy in preflight', async () => {
    const airGap = await PreflightChecks.verifyAirGapIntegrity();
    assert.equal(airGap.airGapEnforced, true);
    assert.equal(airGap.externalCalls, 0);
  });
});
