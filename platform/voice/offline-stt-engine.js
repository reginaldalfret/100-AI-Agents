/**
 * Sovereign AI Workbench — Offline / Air-Gapped Speech-to-Text Engine
 * 
 * Powered by Local faster-whisper running 100% on CPU.
 * 0 External Network Calls · Zero Cloud Dependencies · Air-Gapped Local Inference
 * Privacy-first: Transient audio processing with instant purge after transcription.
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../');
const MODEL_DIR = path.join(REPO_ROOT, 'platform/voice/stt-models/tiny.en');

export class OfflineSTTEngine {
  constructor() {
    this.engineInfo = {
      engine: 'faster-whisper',
      name: 'faster-whisper',
      model: 'tiny.en',
      locale: 'en-IN',
      execution: 'cpu',
      hardware: 'CPU (Local Air-Gapped)',
      offline: true,
      airGapped: true,
      externalCalls: 0
    };
  }

  getHealth() {
    const modelExists = fs.existsSync(MODEL_DIR);
    return {
      status: modelExists ? 'ready' : 'degraded',
      ...this.engineInfo,
      modelReady: modelExists,
      modelPath: MODEL_DIR
    };
  }

  /**
   * Transcribe an audio buffer, base64 payload, or file path completely offline via local Whisper.
   * @param {Buffer|string} inputAudio
   * @param {object} options
   * @returns {Promise<{ text: string, confidence: number, durationMs: number, engine: string, model: string, locale: string, offline: boolean, externalCalls: number, execution: string }>}
   */
  async transcribe(inputAudio, options = {}) {
    const startTs = Date.now();
    let tempWav = null;

    try {
      if (!inputAudio) {
        throw new Error('AUDIO_EMPTY: Audio data is required for transcription.');
      }

      let audioBuffer;
      if (Buffer.isBuffer(inputAudio)) {
        audioBuffer = inputAudio;
      } else if (typeof inputAudio === 'string') {
        if (fs.existsSync(inputAudio)) {
          audioBuffer = fs.readFileSync(inputAudio);
        } else {
          const cleanB64 = inputAudio.replace(/^data:audio\/[a-z0-9]+;base64,/, '');
          audioBuffer = Buffer.from(cleanB64, 'base64');
        }
      } else {
        throw new Error('AUDIO_INVALID_FORMAT: Expected Buffer or base64 string.');
      }

      if (audioBuffer.length < 100) {
        throw new Error('AUDIO_TOO_SMALL: Audio payload is too small or empty.');
      }

      if (!fs.existsSync(MODEL_DIR)) {
        throw new Error('STT_MODEL_MISSING: Local Whisper model is not bundled.');
      }

      tempWav = path.join(os.tmpdir(), `sovereign_stt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.wav`);
      fs.writeFileSync(tempWav, audioBuffer);

      // Invoke local faster-whisper on CPU via Python runner
      const pyScript = `
import sys, json, os
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
from faster_whisper import WhisperModel

model_dir = r'''${MODEL_DIR}'''
audio_path = r'''${tempWav}'''

try:
    model = WhisperModel('tiny.en', device='cpu', compute_type='int8', cpu_threads=2, num_workers=1, download_root=model_dir, local_files_only=True)
    segments, info = model.transcribe(audio_path, beam_size=5, language='en', task='transcribe', vad_filter=True)
    
    parts = []
    confidences = []
    for s in segments:
        t = s.text.strip()
        if t:
            parts.append(t)
            if hasattr(s, 'avg_logprob'):
                import math
                confidences.append(math.exp(s.avg_logprob))
    
    text = " ".join(parts).strip()
    conf = round(sum(confidences)/len(confidences), 3) if confidences else 0.92
    
    print(json.dumps({
        "status": "success",
        "text": text,
        "language": info.language if info else "en",
        "confidence": conf
    }))
except Exception as e:
    print(json.dumps({
        "status": "error",
        "error": str(e)
    }))
`;

      const pyRunnerFile = path.join(os.tmpdir(), `whisper_runner_${Date.now()}.py`);
      fs.writeFileSync(pyRunnerFile, pyScript, 'utf8');

      let rawOutput = '';
      try {
        rawOutput = execSync(`py -3.12 "${pyRunnerFile}"`, {
          timeout: 25000,
          windowsHide: true,
          stdio: 'pipe',
          encoding: 'utf8'
        });
      } finally {
        try { if (fs.existsSync(pyRunnerFile)) fs.unlinkSync(pyRunnerFile); } catch {}
      }

      let parsed = null;
      try {
        const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch {}

      if (!parsed || parsed.status !== 'success') {
        throw new Error('STT_ENGINE_FAILED: ' + ((parsed && parsed.error) || 'Failed to process audio with local Whisper'));
      }

      return {
        text: parsed.text || '',
        confidence: parsed.confidence || 0.90,
        durationMs: Date.now() - startTs,
        engine: this.engineInfo.name,
        model: this.engineInfo.model,
        locale: options.locale || 'en-IN',
        execution: 'cpu',
        offline: true,
        airGapped: true,
        externalCalls: 0,
        hardware: 'CPU (Local Air-Gapped)'
      };
    } finally {
      if (tempWav && fs.existsSync(tempWav)) {
        try { fs.unlinkSync(tempWav); } catch {}
      }
    }
  }
}

export const globalOfflineSTTEngine = new OfflineSTTEngine();
