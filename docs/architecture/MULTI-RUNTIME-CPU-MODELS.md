# 301 Super AI — Multi-Runtime CPU Model Architecture

**Product**: 301 Super AI — Sovereign AI Workbench  
**Platform**: On-Premise Industrial AI System  
**Hardware Profile**: 
- **CPU**: Intel Core i5-11400H (6 Cores / 12 Logical Processors)
- **GPU**: NVIDIA GeForce RTX 2050 (4 GB VRAM)
- **System Memory**: 16 GB DDR4 RAM
**Air-Gap Guarantee**: 100% On-Premise Execution · 0 External Network Calls

---

## 1. Multi-Runtime Abstraction Architecture

In enterprise and industrial deployments, different model families and architectures are optimized for specialized runtime engines:
- **Ollama**: C++ llama.cpp wrapper for GGUF models.
- **ExecuTorch**: Meta's on-device runtime for MobileLLM models.
- **PyTorch / Transformers / ONNX Runtime**: High-throughput layer-scaled model inference (e.g. Apple OpenELM, Faster-Whisper, PaddleOCR).

To prevent vendor lock-in and support diverse open-weight CPU models without forcing them into Ollama, 301 Super AI provides the **`runLocalModel` multi-runtime interface**:

```
                                  CLIENT / AGENT / UI
                                           │
                                           ▼
                                    runLocalModel()
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │                                             │
             GPU EXECUTION                                 CPU EXECUTION
     (execution_target: "GPU")                      (execution_target: "CPU")
     RTX 2050 Mutex Lock (1 active)                 Zero VRAM / Parallel Lock-Free
                    │                                             │
                    ▼                                             ▼
          OLLAMA RUNTIME (11434)                       MULTI-RUNTIME CPU LAYER
      • Nemotron 3 Nano (2.8GB)                 ┌─────────────────────────────────┐
      • Qwen 2.5 Coder 1.5B (986MB)             │ 1. Ollama CPU (11434, num_gpu:0)│
      • Gemma 3 1B (815MB)                      │    • Liquid AI LFM2.5 350M      │
      • Llama 3.2 1B (1.3GB)                    │    • RWKV-7 0.4B                │
      • Granite 4 1B-H (1.4GB)                  │ 2. ExecuTorch (Port 8305)       │
      • Phi-4 Mini (2.5GB)                      │    • Meta MobileLLM-Pro 1B      │
      • SmolLM2 1.7B (1.8GB)                    │    • Meta MobileLLM 350M        │
                                                │ 3. PyTorch / ONNX (Port 8305)   │
                                                │    • Apple OpenELM 450M         │
                                                │    • (Apple OpenELM 1.1B)       │
                                                └─────────────────────────────────┘
```

---

## 2. The 5 Active CPU Models & Roles

| Model | Provider | Params | Quantization | Size | Runtime Type | Badge | Primary Specialization |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Liquid AI LFM2.5 350M** | Liquid AI | 354M | Q8_0 | 379 MB | `OLLAMA` | `[EXTRACTION]` | Structured data extraction, classification, lightweight tool routing |
| **RWKV-7 0.4B** | RWKV | 450M | Q8_0 | 501 MB | `OLLAMA` | `[TEXT]` | Fast RNN text generation, rewriting, simple summarization, fallback |
| **Meta MobileLLM-Pro 1B** | Meta Reality Labs | 1.0B | INT4 | 580 MB | `EXECUTORCH` | `[ASSISTANT]` | General on-device assistant, QA, lightweight reasoning, tool use |
| **Meta MobileLLM 350M** | Meta | 350M | INT4 | 210 MB | `EXECUTORCH` | `[EDGE]` | Ultra-lightweight edge routing, intent classification, quick fallback |
| **Apple OpenELM 450M** | Apple | 450M | FP16/INT8 | 450 MB | `PYTORCH` | `[TEXT]` | Layer-wise parameter scaled summarization & text transformation |

*Optional Future CPU Candidate*: **Apple OpenELM 1.1B** (`apple/OpenELM-1_1B-Instruct`, 1.1B params, 1.1 GB).

---

## 3. Strict Sovereign Air-Gap & Hardware Isolation

1. **Zero Cloud Egress**: All runtimes (Ollama on port 11434, Python compute on port 8305) execute 100% on the local Intel CPU with 0 outbound network requests.
2. **Zero VRAM Consumption**: All 5 CPU models run with 0 GPU layers offloaded, guaranteeing 0 MB allocated on the RTX 2050 GPU.
3. **Trace Truthfulness**: The UI telemetry and backend trace accurately report the actual model engine, provider, runtime type, CPU execution, and 0 external calls.
