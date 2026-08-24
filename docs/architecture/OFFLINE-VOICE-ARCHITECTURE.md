# Sovereign Offline Voice Architecture (STT & TTS)

**Project**: 301 Super AI Agents  
**Platform**: Sovereign AI Workbench (SIH 26117)  
**Status**: 100% Air-Gapped Local Voice Input & Output

---

## 1. Architectural Philosophy

Industrial and defense applications operating under air-gapped constraints cannot use cloud-based speech recognition (Google/Microsoft speech APIs) or cloud text-to-speech services.

The **Sovereign AI Workbench** provides:
1. **Local Offline Speech-to-Text (STT)**: Transcribes microphone audio locally via native speech engines on local CPU.
2. **Local Offline Text-to-Speech (TTS)**: Synthesizes real Indian English Female speech locally via native OneCore/SAPI engines, streaming standard WAV audio to the browser with zero cloud dependencies.

---

## 2. End-to-End Voice Flow

```
                     ┌──────────────────────────────────────────────┐
                     │          USER / MICROPHONE CAPTURE           │
                     └──────────────────────┬───────────────────────┘
                                            │ Local MediaRecorder (audio/webm, audio/wav)
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │      POST /api/stt/transcribe (127.0.0.1)    │
                     └──────────────────────┬───────────────────────┘
                                            │ Transient Buffer
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │   LOCAL STT ENGINE (Local CPU Speech Rec)    │
                     │   MS-1033 DictationGrammar (0 External Calls)│
                     └──────────────────────┬───────────────────────┘
                                            │ Clean Transcript
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │       WORKBENCH COMPOSER POPULATION          │
                     │       (User can edit and press Send)         │
                     └──────────────────────┬───────────────────────┘
                                            │ User Prompt
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │      301 SUPER AI AGENT ORCHESTRATION        │
                     │      (Local Ollama Qwen / Nemotron / Gemma)  │
                     └──────────────────────┬───────────────────────┘
                                            │ AI Response Text
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │              SPEECH SANITIZER                │
                     │   (Strips markdown, fences, tables, traces)  │
                     └──────────────────────┬───────────────────────┘
                                            │ Sanitized Spoken Text
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │      POST /api/tts (127.0.0.1:8300)          │
                     └──────────────────────┬───────────────────────┘
                                            │ Local Offline Synthesis
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │   LOCAL TTS ENGINE (Microsoft Heera - en-IN) │
                     │   Windows OneCore / SAPI5 Local Synthesis    │
                     └──────────────────────┬───────────────────────┘
                                            │ WAV Audio Stream
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │         BROWSER AUDIO PLAYBACK               │
                     │         HTMLAudioElement (URL.createObject)  │
                     └──────────────────────────────────────────────┘
```

---

## 3. Security, Privacy & Resource Isolation

- **Zero GPU Contention**: Voice STT and TTS execute 100% on the **CPU**, ensuring the **RTX 2050 (4GB VRAM)** GPU mutex remains completely free for local LLM inference.
- **Transient Audio Lifecycle**: Recorded microphone audio is kept in memory/transient disk and purged immediately upon transcription.
- **Strict Air-Gap Guarantees**: 0 external network packets leave `127.0.0.1`.
