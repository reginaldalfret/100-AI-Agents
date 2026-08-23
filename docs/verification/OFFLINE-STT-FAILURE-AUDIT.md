# Offline Speech-to-Text Forensic Failure Audit & Root Cause Analysis

**Project**: 301 Super AI Agents  
**Platform**: Sovereign AI Workbench (SIH 26117)  
**Date**: 2026-08-23T18:00:01.052Z

---

## 1. Forensic Failure Reproduction

### Problem Statement:
The previous voice input implementation utilized Windows native `System.Speech.Recognition` / `MS-1033-80-DESK` dictation grammars. In real browser executions with `MediaRecorder` (WebM/Opus audio), this implementation suffered from:
1. Unreliable transcription with non-US English accents.
2. Inability to decode browser WebM/Opus container formats without external transcoders.
3. Dependency on user-specific Windows language pack configuration.

---

## 2. Root Cause & Architectural Resolution

| Flawed Mechanism | Root Cause | Permanent Production Fix |
| :--- | :--- | :--- |
| **Windows Native SAPI Grammar** | Restricted to localized OS dictation dictionaries | Replaced with pre-bundled local **faster-whisper (`tiny.en`)** model |
| **WebM Audio Decoding** | SAPI only supported native 16kHz uncompressed WAV | Implemented native multi-format audio decoding via Python `av` / `ctranslate2` |
| **Air-Gap Verification** | Online fallback risked external network egress | Enforced strict `local_files_only=True` with 0 external network calls |
| **Hardware Contention** | Risk of GPU contention on 4GB RTX 2050 | Pinned Whisper inference strictly to **local CPU** (`device="cpu", compute_type="int8"`) |

---

## 3. Verified Offline Execution Flow

```
Browser Microphone (getUserMedia)
       ↓
Local MediaRecorder (audio/webm, audio/wav)
       ↓
POST http://127.0.0.1:8300/api/stt/transcribe
       ↓
Local faster-whisper Engine (tiny.en on local CPU)
       ↓
Clean Accurate Transcript
       ↓
Workbench Chat Composer (Ready for Edit & Send)
```
