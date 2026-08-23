import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import { globalOfflineSTTEngine, OfflineSTTEngine } from '../../platform/voice/index.js';

test('1. STT Privacy: Transient audio files are strictly deleted from disk after transcription', async () => {
  const engine = new OfflineSTTEngine();
  const sampleRate = 8000;
  const wavBuf = Buffer.alloc(44 + sampleRate * 2);
  wavBuf.write('RIFF', 0);
  wavBuf.writeUInt32LE(36 + sampleRate * 2, 4);
  wavBuf.write('WAVE', 8);
  wavBuf.write('fmt ', 12);
  wavBuf.writeUInt32LE(16, 16);
  wavBuf.writeUInt16LE(1, 20);
  wavBuf.writeUInt16LE(1, 22);
  wavBuf.writeUInt32LE(sampleRate, 24);
  wavBuf.writeUInt32LE(sampleRate * 2, 28);
  wavBuf.writeUInt16LE(2, 32);
  wavBuf.writeUInt16LE(16, 34);
  wavBuf.write('data', 36);
  wavBuf.writeUInt32LE(sampleRate * 2, 40);

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
