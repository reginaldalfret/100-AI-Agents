import test from 'node:test';
import assert from 'node:assert/strict';
import { OfflineSTTEngine } from '../../platform/voice/index.js';

test('1. STT Error Handling: Rejects empty or corrupt audio input cleanly', async () => {
  const engine = new OfflineSTTEngine();

  await assert.rejects(
    async () => engine.transcribe(''),
    /AUDIO_EMPTY/
  );

  await assert.rejects(
    async () => engine.transcribe(Buffer.from('corrupt_tiny_data')),
    /AUDIO_TOO_SMALL/
  );
});
