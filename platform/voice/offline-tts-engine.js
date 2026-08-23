/**
 * Sovereign AI Workbench — Offline / Air-Gapped Text-to-Speech Engine
 * 
 * Generates natural Indian English Female speech completely offline on local hardware.
 * 0 External Network Calls · Zero Cloud Dependencies · Native Windows OneCore Local Synthesis
 */

import { execSync, spawn } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { speechSanitizer } from './speech-sanitizer.js';
import { VoiceProfile } from './voice-profile.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../');
const CACHE_DIR = path.join(REPO_ROOT, 'platform/artifacts/audio_cache');

if (!fs.existsSync(CACHE_DIR)) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  } catch {}
}

export class OfflineTTSEngine {
  constructor() {
    this.memoryCache = new Map();
    this.voiceInfo = {
      name: 'Microsoft Heera',
      displayName: 'Indian English (Natural Female)',
      locale: 'en-IN',
      gender: 'female',
      isOffline: true,
      engine: 'Windows.Media.SpeechSynthesis (OneCore Local)',
      airGapped: true
    };
  }

  getVoiceInfo() {
    return { ...this.voiceInfo };
  }

  /**
   * Synthesize text to WAV audio buffer completely offline.
   * @param {string} rawText
   * @param {object} options
   * @returns {Promise<{ buffer: Buffer, contentType: string, sizeBytes: number, durationMs: number, voice: string, locale: string }>}
   */
  async synthesize(rawText, options = {}) {
    const cleanText = speechSanitizer.sanitizeForSpeech(rawText);
    if (!cleanText || cleanText.trim().length === 0) {
      throw new Error('TTS_EMPTY_TEXT: Cannot synthesize empty text.');
    }

    const startTs = Date.now();
    const hash = crypto.createHash('sha256').update(cleanText + (options.rate || 1.0)).digest('hex').slice(0, 16);
    const cacheFile = path.join(CACHE_DIR, `tts_${hash}.wav`);

    // 1. Check in-memory cache
    if (this.memoryCache.has(hash)) {
      const cached = this.memoryCache.get(hash);
      return {
        buffer: cached,
        contentType: 'audio/wav',
        sizeBytes: cached.length,
        durationMs: Date.now() - startTs,
        voice: this.voiceInfo.name,
        locale: 'en-IN',
        source: 'cached_offline_audio'
      };
    }

    // 2. Check disk cache
    if (fs.existsSync(cacheFile)) {
      try {
        const diskBuf = fs.readFileSync(cacheFile);
        this.memoryCache.set(hash, diskBuf);
        return {
          buffer: diskBuf,
          contentType: 'audio/wav',
          sizeBytes: diskBuf.length,
          durationMs: Date.now() - startTs,
          voice: this.voiceInfo.name,
          locale: 'en-IN',
          source: 'disk_cached_offline_audio'
        };
      } catch {}
    }

    // 3. Synthesize via local Windows OneCore Speech Synthesizer
    const tempWav = path.join(os.tmpdir(), `sovereign_tts_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.wav`);

    const psScript = 'Add-Type -AssemblyName System.Runtime.WindowsRuntime\n' +
      '$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | ? { $_.Name -eq \'AsTask\' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq \'IAsyncOperation`1\' })[0]\n' +
      'Function Await($WinRtTask, $ResultType) {\n' +
      '    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)\n' +
      '    $netTask = $asTask.Invoke($null, @($WinRtTask))\n' +
      '    $netTask.Wait(-1) | Out-Null\n' +
      '    $netTask.Result\n' +
      '}\n' +
      '[Windows.Media.SpeechSynthesis.SpeechSynthesizer, Windows.Media, ContentType = WindowsRuntime] | Out-Null\n' +
      '$synth = New-Object Windows.Media.SpeechSynthesis.SpeechSynthesizer\n' +
      '$heera = [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices | Where-Object { $_.DisplayName -like \'*Heera*\' -or ($_.Language -eq \'en-IN\' -and $_.Gender -eq \'Female\') } | Select-Object -First 1\n' +
      'if ($heera) { $synth.Voice = $heera }\n' +
      '$text = @"\n' + cleanText.replace(/"/g, '`"') + '\n"@\n' +
      '$streamOp = $synth.SynthesizeTextToStreamAsync($text)\n' +
      '$stream = Await $streamOp ([Windows.Media.SpeechSynthesis.SpeechSynthesisStream])\n' +
      '$reader = New-Object Windows.Storage.Streams.DataReader($stream)\n' +
      '$loadOp = $reader.LoadAsync($stream.Size)\n' +
      '$loadTask = Await $loadOp ([System.UInt32])\n' +
      '$bytes = New-Object byte[] $stream.Size\n' +
      '$reader.ReadBytes($bytes)\n' +
      '[System.IO.File]::WriteAllBytes(\'' + tempWav.replace(/\\/g, '\\\\') + '\', $bytes)\n';

    const scriptFile = path.join(os.tmpdir(), `sovereign_tts_${Date.now()}.ps1`);
    fs.writeFileSync(scriptFile, psScript, 'utf8');

    try {
      execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptFile}"`, {
        timeout: 15000,
        windowsHide: true,
        stdio: 'pipe'
      });
    } catch (execErr) {
      // Fallback to SAPI5 System.Speech if WindowsRuntime throws
      this._synthesizeWithSAPI(cleanText, tempWav);
    } finally {
      try { if (fs.existsSync(scriptFile)) fs.unlinkSync(scriptFile); } catch {}
    }

    if (!fs.existsSync(tempWav)) {
      throw new Error('TTS_SYNTHESIS_FAILED: Failed to produce local audio stream.');
    }

    const audioBuffer = fs.readFileSync(tempWav);
    try { fs.unlinkSync(tempWav); } catch {}

    // Store in cache
    try { fs.writeFileSync(cacheFile, audioBuffer); } catch {}
    this.memoryCache.set(hash, audioBuffer);

    return {
      buffer: audioBuffer,
      contentType: 'audio/wav',
      sizeBytes: audioBuffer.length,
      durationMs: Date.now() - startTs,
      voice: this.voiceInfo.name,
      locale: 'en-IN',
      source: 'offline_local_synthesis'
    };
  }

  /**
   * SAPI5 System.Speech fallback for standard desktop Windows environments
   */
  _synthesizeWithSAPI(text, outPath) {
    const psCmd = `powershell -NoProfile -Command "Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.SetOutputToWaveFile('${outPath.replace(/\\/g, '\\\\')}'); $s.Speak('${text.replace(/'/g, "''")}'); $s.Dispose()"`;
    execSync(psCmd, { timeout: 15000, windowsHide: true, stdio: 'pipe' });
  }
}

export const globalOfflineTTSEngine = new OfflineTTSEngine();
