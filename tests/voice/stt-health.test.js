import test from 'node:test';
import assert from 'node:assert/strict';
import { globalOfflineSTTEngine, OfflineSTTEngine } from '../../platform/voice/index.js';

test('1. STT Health: Truthfully discloses offline local engine and zero external calls', () => {
  const engine = new OfflineSTTEngine();
  const health = engine.getHealth();

  assert.equal(health.status, 'ready');
  assert.equal(health.offline, true, 'STT must be strictly offline');
  assert.equal(health.airGapped, true, 'STT must be air-gapped');
  assert.equal(health.externalCalls, 0, 'Must have 0 external network calls');
  assert.equal(health.execution, 'cpu');
  assert.equal(health.engine, 'faster-whisper');
  assert.equal(health.model, 'tiny.en');
});
