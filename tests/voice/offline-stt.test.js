import test from 'node:test';
import assert from 'node:assert/strict';
import { globalOfflineSTTEngine, OfflineSTTEngine } from '../../platform/voice/index.js';

test('1. Offline STT Architecture: Rejects empty or corrupt audio input', async () => {
  const engine = new OfflineSTTEngine();
  await assert.rejects(
    async () => engine.transcribe(''),
    /STT_EMPTY_AUDIO/
  );
  await assert.rejects(
    async () => engine.transcribe(Buffer.from('tiny')),
    /STT_AUDIO_TOO_SMALL/
  );
});

test('2. Offline STT Transcription: Accepts base64 audio and transcribes locally', async () => {
  const engine = new OfflineSTTEngine();
  // Generate valid synthetic dummy WAV buffer (44 bytes RIFF header + silence PCM)
  const sampleRate = 16000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const numSamples = sampleRate; // 1 second
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = numSamples * (bitsPerSample / 8);
  const chunkSize = 36 + dataSize;

  const wavBuf = Buffer.alloc(44 + dataSize);
  wavBuf.write('RIFF', 0);
  wavBuf.writeUInt32LE(chunkSize, 4);
  wavBuf.write('WAVE', 8);
  wavBuf.write('fmt ', 12);
  wavBuf.writeUInt32LE(16, 16); // PCM
  wavBuf.writeUInt16LE(1, 20);  // Format 1
  wavBuf.writeUInt16LE(numChannels, 22);
  wavBuf.writeUInt32LE(sampleRate, 24);
  wavBuf.writeUInt32LE(byteRate, 28);
  wavBuf.writeUInt16LE(blockAlign, 32);
  wavBuf.writeUInt16LE(bitsPerSample, 34);
  wavBuf.write('data', 36);
  wavBuf.writeUInt32LE(dataSize, 40);

  const b64 = 'data:audio/wav;base64,' + wavBuf.toString('base64');
  const result = await engine.transcribe(b64, { locale: 'en-IN' });

  assert.ok(result, 'Must return result');
  assert.equal(result.offline, true);
  assert.equal(result.externalCalls, 0);
  assert.equal(result.locale, 'en-IN');
  assert.ok(typeof result.durationMs === 'number');
});
