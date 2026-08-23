# Sovereign Offline Speech-to-Text (STT) Architecture

**Project**: 301 Super AI Agents  
**Platform**: Sovereign AI Workbench (SIH 26117)  
**Status**: 100% Air-Gapped Local Speech Recognition via faster-whisper

---

## 1. Engine & Model Specifications

- **Engine**: `faster-whisper` (CTranslate2 optimized transformer runtime)
- **Model**: `tiny.en` (39MB INT8 quantized local weights)
- **Location**: `platform/voice/stt-models/tiny.en`
- **Execution Device**: Local CPU (Zero GPU VRAM contention with RTX 2050 LLM inference)
- **Air-Gap Policy**: `local_files_only=True` (0 external network calls)
- **Audio Processing**: Local multi-format decoding with Voice Activity Detection (VAD) filter

---

## 2. Privacy & Security Invariants

1. **Transient Audio**: Recorded audio is held in transient memory/temporary files during inference and purged immediately upon completion.
2. **Zero Cloud Telemetry**: 0 external API calls or tracking.
3. **Graceful Error States**: Returns `STT_MODEL_MISSING` or `AUDIO_EMPTY` rather than silent hangs.
