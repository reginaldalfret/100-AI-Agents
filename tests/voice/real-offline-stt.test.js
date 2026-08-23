import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import { globalOfflineSTTEngine, OfflineSTTEngine } from '../../platform/voice/index.js';

test('1. Real Offline STT: Transcribes real spoken audio fixture without internet', async () => {
  const engine = new OfflineSTTEngine();
  const fixturePath = 'E:/Smart Automation/100-AI-Agents/tests/fixtures/audio/sample-speech.wav';

  const result = await engine.transcribe(fixturePath);

  assert.ok(result.text, 'Must produce a non-empty transcript');
  assert.match(result.text, /python/i, 'Transcript must contain the spoken word python');
  assert.equal(result.engine, 'faster-whisper');
  assert.equal(result.model, 'tiny.en');
  assert.equal(result.execution, 'cpu');
  assert.equal(result.offline, true);
  assert.equal(result.externalCalls, 0);
});
