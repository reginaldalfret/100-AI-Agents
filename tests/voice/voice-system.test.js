/**
 * Test Suite: Universal Voice System Subsystem
 * Verifies Indian English STT, TTS Profile, Speech Sanitizer, and Universal 101 Agent Inheritance.
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { voiceService, speechSanitizer, VoiceProfile } from '../../platform/voice/index.js';
import { agentScopeGuard } from '../../platform/intelligence/index.js';
import { conversationManager } from '../../platform/context/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

test('1. Voice Profile — Polished Indian English (en-IN)', () => {
  const profile = voiceService.getProfile();
  assert.strictEqual(profile.language, 'en-IN', 'Language must be Indian English');
  assert.strictEqual(profile.locale, 'en-IN');
  assert.ok(profile.rate >= 1.0 && profile.rate <= 1.15, 'Speech rate must be natural');
  assert.ok(profile.technicalVocabulary.includes('PostgreSQL'), 'Must include technical vocabulary');
  assert.ok(profile.technicalVocabulary.includes('Python'));
  assert.ok(profile.technicalVocabulary.includes('NVIDIA'));
});

test('2. Speech Sanitizer — Strips Code Fences, Tables, and UI Diagnostics for Audio', () => {
  const rawResponse = `
### Summary of Findings
Renewable energy is rapidly expanding across India.

\`\`\`python
def calculate_solar_yield(kwp, radiation):
    return kwp * radiation * 0.75
\`\`\`

| Source | Capacity (GW) |
|---|---|
| Solar | 70 |
| Wind | 45 |

⚡ 0 External Calls · AUDIT ID INT-2026-991823
`;

  const spoken = speechSanitizer.sanitizeForSpeech(rawResponse);
  assert.ok(!spoken.includes('```'), 'Must strip code fences');
  assert.ok(!spoken.includes('def calculate_solar_yield'), 'Must not read raw code blocks aloud');
  assert.ok(spoken.includes('I have generated the code on screen'), 'Must insert polite spoken placeholder for code');
  assert.ok(!spoken.includes('0 External Calls'), 'Must strip UI telemetry tags');
  assert.ok(!spoken.includes('AUDIT ID'), 'Must strip audit tags');
  assert.ok(!spoken.includes('| Source |'), 'Must strip raw markdown table formatting');
  assert.ok(spoken.includes('The data table is displayed on screen'), 'Must insert spoken table notice');
});

test('3. Streaming Sentence Chunking for Low Latency TTS', () => {
  const streamText = 'Renewable energy is essential for the future. Solar and wind power lead the transition! Are there any questions?';
  const sentences = speechSanitizer.chunkIntoSentences(streamText);
  assert.strictEqual(sentences.length, 3, 'Must chunk into exactly 3 sentences');
  assert.strictEqual(sentences[0], 'Renewable energy is essential for the future.');
  assert.strictEqual(sentences[1], 'Solar and wind power lead the transition!');
  assert.strictEqual(sentences[2], 'Are there any questions?');
});

test('4. Technical Vocabulary Normalization in Transcriptions', () => {
  const rawTranscript = 'can you write a python script for postgres and deploy with docker to kubernetes';
  const normalized = voiceService.processTranscription(rawTranscript);
  assert.ok(normalized.includes('Python'), 'Must capitalize Python');
  assert.ok(normalized.includes('PostgreSQL'), 'Must normalize Postgres to PostgreSQL');
  assert.ok(normalized.includes('Docker'), 'Must capitalize Docker');
  assert.ok(normalized.includes('Kubernetes'), 'Must capitalize Kubernetes');
});

test('5. Universal Voice Capability — All 101 Agents Inherit Voice Modality', () => {
  const registryRaw = fs.readFileSync(path.join(ROOT, 'registry', 'agents.json'), 'utf8');
  const registry = JSON.parse(registryRaw);
  assert.strictEqual(registry.length, 101, 'Must have exactly 101 agents');

  // Verify voice actions and UI integration exists centrally in app.js and index.html
  const appJs = fs.readFileSync(path.join(ROOT, 'platform', 'web', 'app.js'), 'utf8');
  const indexHtml = fs.readFileSync(path.join(ROOT, 'platform', 'web', 'index.html'), 'utf8');

  assert.ok(indexHtml.includes('voiceInputBtn'), 'HTML must have voiceInputBtn');
  assert.ok(indexHtml.includes('voiceRecordingBanner'), 'HTML must have voiceRecordingBanner');
  assert.ok(appJs.includes('btn-read-aloud'), 'app.js must render Read Aloud button');
  assert.ok(appJs.includes('toggleVoiceRecording'), 'app.js must implement voice recording handler');
  assert.ok(appJs.includes('toggleSpeech'), 'app.js must implement speech synthesis handler');
});

test('6. Voice Transcript + Agent Scope Guard Integration', () => {
  const dataset = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests', 'voice', 'indian-english-voice-dataset.json'), 'utf8'));
  for (const item of dataset) {
    const agent = { agent_id: item.agent_id, name: item.agent_name };
    const decision = agentScopeGuard.checkScope(agent, item.transcript);
    assert.strictEqual(decision.inScope, item.expected_in_scope, `Scope check failed for ${item.id}`);
  }
});
