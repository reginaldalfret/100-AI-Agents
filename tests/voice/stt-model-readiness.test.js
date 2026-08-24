import test from 'node:test';
import assert from 'node:assert/strict';
import { globalOfflineSTTEngine } from '../../platform/voice/index.js';

test('1. STT Model Readiness: Reports ready status and local model path', () => {
  const health = globalOfflineSTTEngine.getHealth();

  assert.equal(health.status, 'ready');
  assert.equal(health.modelReady, true);
  assert.equal(health.engine, 'faster-whisper');
  assert.equal(health.model, 'tiny.en');
  assert.equal(health.execution, 'cpu');
  assert.equal(health.offline, true);
  assert.equal(health.airGapped, true);
  assert.equal(health.externalCalls, 0);
  assert.ok(health.modelPath.includes('stt-models'));
});
