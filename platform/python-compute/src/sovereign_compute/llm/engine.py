"""
Sovereign Compute — LLM Subsystem
Note: MobileLLM 350M and OpenELM 450M have been fully decommissioned.
CPU text generation is handled natively via Ollama on port 11434 (Liquid AI LFM2.5 350M & RWKV-7 0.4B).
"""

from typing import Dict, Any, Optional

MODEL_REGISTRY = {}
MODEL_ALIASES = {}

def generate_text(
    model_name: str,
    prompt: str,
    system: Optional[str] = None,
    max_tokens: int = 150,
    temperature: float = 0.7,
    top_p: float = 0.9,
    repetition_penalty: float = 1.15
) -> Dict[str, Any]:
    return {
        "text": "Native Python LLM inference engine decommissioned. Use Ollama runtime.",
        "status": "error",
        "error": "MODEL_DECOMMISSIONED",
        "tokens_generated": 0,
        "duration_ms": 0,
        "hardware": "CPU ONLY",
        "gpu_vram_mb": 0,
        "external_calls": 0
    }

def get_llm_health() -> Dict[str, Any]:
    return {
        "status": "idle",
        "supported_models": [],
        "hardware_target": "CPU",
        "gpu_vram_mb": 0,
        "is_air_gapped": True
    }

def list_supported_models() -> Dict[str, Any]:
    return MODEL_REGISTRY
