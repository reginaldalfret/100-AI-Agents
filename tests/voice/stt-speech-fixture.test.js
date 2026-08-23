import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import { globalOfflineSTTEngine } from '../../platform/voice/index.js';

test('1. Speech Fixture: Transcribes base64 encoded audio stream', async () => {
  const fixturePath = 'E:/Smart Automation/100-AI-Agents/tests/fixtures/audio/sample-speech.wav';
  const audioBuf = fs.readFileSync(fixturePath);
  const base64Data = 'data:audio/wav;base64,' + audioBuf.toString('base64');

  const result = await globalOfflineSTTEngine.transcribe(base64Data, { locale: 'en-IN' });

  assert.ok(result.text.length > 5);
  assert.match(result.text, /python/i);
  assert.equal(result.offline, true);
  assert.equal(result.externalCalls, 0);
});
