"""
Sovereign AI Workbench — Local Offline Speech-to-Text Engine (faster-whisper)
Runs 100% offline on local CPU using pre-bundled local Whisper weights.
0 External Network Calls · Zero Cloud Dependencies · Local Air-Gapped Inference
"""

import os
import time
import base64
import tempfile
from pathlib import Path

# Path to pre-bundled local Whisper model
PROJECT_ROOT = Path(__file__).resolve().parents[5]

def resolve_whisper_model_dir() -> str:
    if "WHISPER_MODEL_DIR" in os.environ and os.path.exists(os.environ["WHISPER_MODEL_DIR"]):
        return os.environ["WHISPER_MODEL_DIR"]
    
    local_app_data = os.environ.get("LOCALAPPDATA", "")
    if local_app_data:
        app_data_path = os.path.join(local_app_data, "301SuperAI", "models", "whisper", "tiny.en")
        if os.path.exists(app_data_path):
            return app_data_path
            
    candidate_paths = [
        os.path.join(str(PROJECT_ROOT), "platform", "voice", "stt-models", "tiny.en"),
        os.path.join(str(PROJECT_ROOT), "models", "whisper", "tiny.en"),
        os.path.join(str(Path(__file__).resolve().parent), "models", "tiny.en")
    ]
    for cp in candidate_paths:
        if os.path.exists(cp):
            return cp
    return candidate_paths[0]

MODEL_DIR = resolve_whisper_model_dir()

# Global singleton model cache
_cached_model = None

def get_whisper_model():
    global _cached_model
    if _cached_model is not None:
        return _cached_model
    try:
        from faster_whisper import WhisperModel
        if not os.path.exists(MODEL_DIR):
            return None
        _cached_model = WhisperModel(
            "tiny.en",
            device="cpu",
            compute_type="int8",
            cpu_threads=2,
            num_workers=1,
            download_root=MODEL_DIR,
            local_files_only=True
        )
        return _cached_model
    except Exception as e:
        print(f"[WHISPER_LOAD_WARN] Failed to load local Whisper: {e}")
        return None

def get_stt_health() -> dict:
    model_exists = os.path.exists(MODEL_DIR)
    return {
        "status": "ready" if model_exists else "degraded",
        "engine": "faster-whisper",
        "model": "tiny.en",
        "execution": "cpu",
        "hardware": "CPU (Local Air-Gapped)",
        "offline": True,
        "air_gapped": True,
        "external_calls": 0,
        "model_path": MODEL_DIR,
        "model_ready": model_exists
    }

def transcribe_audio(audio_path: str = None, audio_base64: str = None, locale: str = "en-IN") -> dict:
    start_ts = time.time()
    temp_file = None

    try:
        if not audio_base64 and (not audio_path or not os.path.exists(audio_path)):
            return {
                "text": "",
                "confidence": 0.0,
                "duration_ms": 0,
                "error": "AUDIO_EMPTY: No audio provided for transcription.",
                "offline": True,
                "external_calls": 0
            }

        # Write transient audio to temporary file
        if audio_base64:
            clean_b64 = audio_base64
            if "," in clean_b64:
                clean_b64 = clean_b64.split(",", 1)[1]
            audio_bytes = base64.b64decode(clean_b64)
            
            if len(audio_bytes) < 100:
                return {
                    "text": "",
                    "confidence": 0.0,
                    "duration_ms": 0,
                    "error": "AUDIO_TOO_SMALL: Audio payload is too small.",
                    "offline": True,
                    "external_calls": 0
                }

            temp_file = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
            temp_file.write(audio_bytes)
            temp_file.close()
            target_path = temp_file.name
        else:
            target_path = audio_path

        model = get_whisper_model()
        if model is None:
            return {
                "text": "",
                "confidence": 0.0,
                "duration_ms": int((time.time() - start_ts) * 1000),
                "error": "STT_MODEL_MISSING: Local Whisper model is not bundled.",
                "offline": True,
                "external_calls": 0
            }

        segments, info = model.transcribe(
            target_path,
            beam_size=5,
            language="en",
            task="transcribe",
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=400)
        )

        transcript_parts = []
        confidences = []
        for segment in segments:
            text = segment.text.strip()
            if text:
                transcript_parts.append(text)
                if hasattr(segment, 'avg_logprob'):
                    import math
                    confidences.append(math.exp(segment.avg_logprob))

        full_transcript = " ".join(transcript_parts).strip()
        avg_confidence = round(sum(confidences) / len(confidences), 3) if confidences else 0.90

        elapsed_ms = int((time.time() - start_ts) * 1000)

        return {
            "text": full_transcript,
            "language": "en",
            "locale": locale,
            "confidence": avg_confidence,
            "duration_ms": elapsed_ms,
            "engine": "faster-whisper",
            "model": "tiny.en",
            "execution": "cpu",
            "offline": True,
            "air_gapped": True,
            "external_calls": 0,
            "hardware": "CPU (Local)"
        }

    except Exception as e:
        return {
            "text": "",
            "confidence": 0.0,
            "duration_ms": int((time.time() - start_ts) * 1000),
            "error": f"STT_ENGINE_FAILED: {str(e)}",
            "offline": True,
            "external_calls": 0
        }
    finally:
        if temp_file and os.path.exists(temp_file.name):
            try:
                os.unlink(temp_file.name)
            except Exception:
                pass
