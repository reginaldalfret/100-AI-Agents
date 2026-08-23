# Universal Voice System Architecture

**Platform:** Sovereign AI Workbench  
**Project:** 101 Super AI Agents  
**Hardware:** NVIDIA RTX 2050 (4GB VRAM) / 8GB System RAM  
**Target Voice Profile:** Warm, Professional Indian English (`en-IN`)  
**Egress Guarantee:** Strict Zero Cloud / 100% On-Premise Air-Gapped  

---

## 1. Universal Platform Capability

Voice is a **platform-wide modality** inherited centrally by all 101 agents:
- `voiceInput: true` (Speech-to-Text with live audio level meter and editable transcript in composer)
- `voiceOutput: true` (Text-to-Speech with sentence-level streaming, code sanitization, and Read Aloud / Stop controls)

Individual agents dictate **what to say** based on their specialized industrial domain; the platform voice subsystem dictates **how to transcribe and speak it**.

---

## 2. End-to-End Voice Flow

```
MICROPHONE (Browser / Web Audio API)
    │
    ▼ (Real Amplitude Metering with AnalyserNode)
LOCAL STT (Indian English en-IN)
    │
    ▼
EDITABLE COMPOSER (User reviews or amends transcript)
    │
    ▼
CONVERSATION MEMORY & REFERENCE RESOLUTION
    │
    ▼
AGENT SCOPE GUARD (Validates in-scope vs specialist handoff)
    │
    ▼
LOCAL LLM STREAMING (Nemotron 3 / Gemma 3 / Qwen Coder)
    │
    ▼
SPEECH SANITIZER (Removes raw code fences, tables, telemetry)
    │
    ▼
LOCAL TTS (Polished Indian English Pronunciation & Pacing)
    │
    ▼
AUDIO OUTPUT & PLAYBACK QUEUE (With instant [■ Stop] control)
```

---

## 3. Hardware Safety & Egress

1. **Air-Gap Compliance**: Zero external speech APIs or cloud telemetry calls.
2. **GPU Protection**: Single-GPU concurrency lock (`MAX_GPU_CONCURRENCY = 1`) guarantees speech processing never exhausts GPU VRAM or collides with active model inference.
