# Voice System Audit & Local Architecture Baseline

**Platform:** Sovereign AI Workbench  
**Project:** 101 Super AI Agents  
**Hardware Profile:** NVIDIA RTX 2050 (4GB VRAM) / 8GB System RAM  
**Target Voice Profile:** Polished, Warm, Natural Indian English (`en-IN`)  
**Egress Policy:** Strict Zero Cloud / 100% On-Premise Air-Gapped  

---

## 1. Audit of Existing Audio / Speech Capabilities

- **Platform Root**: Previously had no centralized `platform/voice/` subsystem.
- **Microphone Handling**: Composer previously had file attachments, but no microphone input button.
- **TTS / Speech Synthesis**: Messages had Copy and Answer buttons, but lacked streaming Read Aloud / Stop voice controls.
- **Model Engine**:
  - Google Gemma 3 (4B) handles visual / multimodal understanding.
  - NVIDIA Nemotron 3 Nano handles epistemic reasoning & text generation.
  - Qwen 2.5 Coder (1.5B) handles code & technical data.
- **GPU Safety**: With 4GB VRAM and single GPU-concurrency lock (`MAX_GPU_CONCURRENCY = 1`), speech processing must be lightweight (CPU or browser-native audio nodes) to avoid GPU VRAM exhaustion or interfering with active LLM streaming.

---

## 2. Target Universal Platform Voice Architecture

```
MICROPHONE
    │
    ▼ (Web Audio API / AnalyserNode Amplitude)
LOCAL STT (en-IN Indian English Engine)
    │
    ▼
TRANSCRIPT IN COMPOSER (Editable before sending)
    │
    ▼
CONVERSATION MEMORY & SCOPE GUARD
    │
    ▼
LOCAL LLM STREAMING
    │
    ▼ (Sentence Chunking & Markdown Sanitization)
LOCAL TTS (Polished Indian English Profile)
    │
    ▼
AUDIO PLAYBACK (Fluid Playback with [Stop] Control)
```

---

## 3. Key Design Decisions

1. **Universal Platform Inheritance**: All 101 AI Agents inherit voice input and voice output centrally.
2. **Audio Sanitization**: Code blocks, raw table markup, and diagnostic tags are stripped or translated into conversational spoken phrasing before speech synthesis.
3. **Real Amplitude Metering**: Microphone meter uses live `AudioContext` frequency analysis rather than static looping animations.
4. **Editable Transcript**: Speech recognition transcribes directly into the composer input field so the user can review and edit before sending.
