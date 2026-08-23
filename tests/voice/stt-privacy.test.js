import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import { globalOfflineSTTEngine, OfflineSTTEngine } from '../../platform/voice/index.js';

test('1. STT Privacy: Transient audio files are strictly deleted from disk after transcription', async () => {
  const fixturePath = 'E:/Smart Automation/100-AI-Agents/tests/fixtures/audio/sample-speech.wav';
  const wavBuf = fs.readFileSync(fixturePath);
  const engine = new OfflineSTTEngine();

  let createdFile = null;
  const originalWriteFileSync = fs.writeFileSync;
  fs.writeFileSync = function(p, ...args) {
    if (typeof p === 'string' && p.includes('sovereign_stt_')) {
      createdFile = p;
    }
    return originalWriteFileSync.call(fs, p, ...args);
  };

  try {
    await engine.transcribe(wavBuf);
  } finally {
    fs.writeFileSync = originalWriteFileSync;
  }

  assert.ok(createdFile, 'A temporary audio file must have been created');
  assert.equal(fs.existsSync(createdFile), false, 'The created temporary audio file must be purged after transcription');
});
