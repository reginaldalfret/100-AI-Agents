import test from 'node:test';
import assert from 'node:assert/strict';
import { globalOfflineTTSEngine, OfflineTTSEngine, VoiceProfile, speechSanitizer } from '../../platform/voice/index.js';

test('1. Offline TTS Voice Profile: Truthfully identifies local installed voice and en-IN locale', () => {
  const engine = new OfflineTTSEngine();
  const info = engine.getVoiceInfo();

  assert.equal(info.isOffline, true, 'Must declare isOffline true');
  assert.equal(info.airGapped, true, 'Must declare airGapped true');
  assert.equal(info.locale, 'en-IN', 'Locale must be Indian English');
  assert.equal(info.gender, 'female', 'Gender must be female');
  assert.ok(info.name.includes('Heera') || info.name.includes('Indian'), 'Name must match local Indian voice');
});

test('2. Offline TTS Audio Synthesis: Produces valid local WAV audio with standard RIFF headers', async () => {
  const engine = new OfflineTTSEngine();
  const sampleText = 'Welcome to the Sovereign AI Workbench. This is a local offline test.';

  const result = await engine.synthesize(sampleText);

  assert.ok(result.buffer, 'Must return audio buffer');
  assert.ok(Buffer.isBuffer(result.buffer), 'Result buffer must be Node Buffer');
  assert.ok(result.buffer.length > 1000, 'WAV buffer must be non-empty (>1000 bytes)');
  assert.equal(result.contentType, 'audio/wav');
  assert.equal(result.locale, 'en-IN');

  // Verify standard WAV RIFF header
  const riffHeader = result.buffer.toString('ascii', 0, 4);
  const waveHeader = result.buffer.toString('ascii', 8, 12);
  assert.equal(riffHeader, 'RIFF', 'Header must begin with RIFF');
  assert.equal(waveHeader, 'WAVE', 'Format must be WAVE');
});

test('3. Offline TTS Caching: Subsequent syntheses retrieve cached audio instantly', async () => {
  const engine = new OfflineTTSEngine();
  const sampleText = 'Caching verification for local air-gapped text to speech.';

  // First pass
  const first = await engine.synthesize(sampleText);
  // Second pass (cached)
  const second = await engine.synthesize(sampleText);

  assert.equal(first.buffer.length, second.buffer.length);
  assert.ok(second.source.includes('cached'), 'Second pass must be served from cache');
});

test('4. Offline TTS Error Handling: Rejects empty text with descriptive error', async () => {
  const engine = new OfflineTTSEngine();
  await assert.rejects(
    async () => engine.synthesize(''),
    /TTS_EMPTY_TEXT/
  );
});
