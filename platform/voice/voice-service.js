/**
 * Sovereign AI Workbench — Universal Voice Service Engine
 * Provides local STT transcription normalization, Indian English TTS profiles, and audio state management.
 */

import { VoiceProfile } from './voice-profile.js';
import { speechSanitizer } from './speech-sanitizer.js';

export class VoiceService {
  constructor() {
    this.profile = { ...VoiceProfile };
    this.audioQueue = [];
    this.isPlaying = false;
  }

  getProfile() {
    return this.profile;
  }

  updateProfile(options = {}) {
    this.profile = { ...this.profile, ...options };
    return this.profile;
  }

  /**
   * Sanitizes text for audio playback
   */
  sanitizeText(rawText) {
    return speechSanitizer.sanitizeForSpeech(rawText);
  }

  /**
   * Chunks text into streaming speech segments
   */
  chunkText(text) {
    return speechSanitizer.chunkIntoSentences(text);
  }

  /**
   * Local transcription post-processor ensuring technical Indian English vocabulary is preserved.
   */
  processTranscription(rawTranscript) {
    if (!rawTranscript || typeof rawTranscript !== 'string') return '';

    let text = rawTranscript.trim();

    // Correct common phonetic transcriptions of technical terms
    const corrections = [
      { pattern: /\bpython\b/gi, replacement: 'Python' },
      { pattern: /\bjavascript\b/gi, replacement: 'JavaScript' },
      { pattern: /\btypescript\b/gi, replacement: 'TypeScript' },
      { pattern: /\bpostgres(ql)?\b/gi, replacement: 'PostgreSQL' },
      { pattern: /\bnode(\s?js)?\b/gi, replacement: 'Node.js' },
      { pattern: /\bdocker\b/gi, replacement: 'Docker' },
      { pattern: /\bkubernetes\b/gi, replacement: 'Kubernetes' },
      { pattern: /\bnvidia\b/gi, replacement: 'NVIDIA' },
      { pattern: /\bgemma(\s?3)?\b/gi, replacement: 'Google Gemma 3' },
      { pattern: /\bnemotron(\s?3)?\b/gi, replacement: 'NVIDIA Nemotron 3' },
      { pattern: /\bqwen(\s?coder)?\b/gi, replacement: 'Qwen 2.5 Coder' },
      { pattern: /\brest\s?api\b/gi, replacement: 'REST API' },
      { pattern: /\bapi\b/gi, replacement: 'API' },
      { pattern: /\bjson\b/gi, replacement: 'JSON' },
      { pattern: /\bsql\b/gi, replacement: 'SQL' },
      { pattern: /\bocr\b/gi, replacement: 'OCR' },
      { pattern: /\bp\s?and\s?id\b/gi, replacement: 'P&ID' }
    ];

    for (const { pattern, replacement } of corrections) {
      text = text.replace(pattern, replacement);
    }

    return text;
  }
}

export const voiceService = new VoiceService();
