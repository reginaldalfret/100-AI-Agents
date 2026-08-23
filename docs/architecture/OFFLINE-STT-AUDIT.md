# Offline / Air-Gapped Speech-to-Text (STT) Architecture Audit

**Project**: 301 Super AI Agents  
**Platform**: Sovereign AI Workbench (SIH 26117)  
**Status**: 100% Local Air-Gapped STT Pipeline

---

## 1. Problem Audit & Root Cause Analysis

### Previous System Limitation:
- The previous browser-based voice input relied on `window.webkitSpeechRecognition` or `window.SpeechRecognition`.
- In Chromium-based browsers (Edge, Chrome) on Windows, `SpeechRecognition` sends audio packets over HTTPS/WSS to external cloud servers (Google/Microsoft speech clouds).
- **When the laptop is offline or air-gapped, `SpeechRecognition` errors with `network` failure or remains completely unresponsive**, making voice input unusable in offline secure environments.

---

## 2. Local Offline STT Engine Architecture

| Requirement | Evaluation | Selected Solution |
| :--- | :--- | :--- |
| **Air-Gap Compliance** | Must operate with internet physically disconnected | Local Windows Native Speech Recognition Engine / Local Python STT |
| **Hardware Safety** | Must not compete with 4GB VRAM GPU LLM inference | 100% CPU-bound local transcription |
| **Audio Capture** | Local browser microphone capture | Browser `getUserMedia()` + `MediaRecorder` $\rightarrow$ Localhost POST |
| **Audio Processing** | Transient processing only | Converted in memory/temp, immediately purged after transcription |
| **Privacy & Security** | Zero external egress, zero permanent audio recording | Transient audio life-cycle ($< 500\text{ms}$), 0 permanent audio storage |

---

## 3. End-to-End Offline Voice Input Pipeline

```
USER SPEECH (Microphone)
       ↓
Browser MediaRecorder (audio/webm, audio/wav)
       ↓
POST /api/stt/transcribe (127.0.0.1:8300)
       ↓
Local STT Engine (platform/voice/offline-stt-engine.js)
       ↓
Local Speech Recognizer (100% Local CPU Execution)
       ↓
Clean Text Transcript
       ↓
Workbench Chat Composer (Populates textarea for user edit & send)
       ↓
301 Super AI Agent Workflow Execution
```

---

## 4. Verification & Guarantees

1. **Zero External Calls**: 100% of audio capture, encoding, and transcription occurs strictly on `127.0.0.1`.
2. **True Offline Readiness**: Works identically whether Wi-Fi/Ethernet is connected or physically unplugged.
3. **Graceful Error States**: Explicit error classifications for `MICROPHONE_PERMISSION_DENIED`, `AUDIO_CAPTURE_FAILED`, and `STT_MODEL_UNAVAILABLE`.
