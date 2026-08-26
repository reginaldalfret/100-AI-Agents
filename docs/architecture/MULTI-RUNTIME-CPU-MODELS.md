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
- **Ollama**: C++ llama.cpp wrapper for GGUF models on CPU (e.g. Liquid AI LFM2.5 350M, RWKV-7 0.4B).
- **Python Compute / ONNX Runtime**: High-throughput CPU inference for Document Intelligence (PaddleOCR 3.7.0, RapidOCR) and Voice STT (Faster-Whisper).

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
                                                │ 1. Ollama CPU (11434, num_gpu:0)│
                                                │    • Liquid AI LFM2.5 350M      │
                                                │    • RWKV-7 0.4B                │
                                                │    • TinyLlama 1.1B             │
                                                │    • Stable LM 2 1.6B           │
                                                │ 2. Python Compute (Port 8305)   │
                                                │    • PaddleOCR / RapidOCR       │
                                                │    • Faster-Whisper             │
                                                └─────────────────────────────────┘
```

---

## 2. The Active CPU Models & Roles

| Model | Provider | Params | Quantization | Size | Runtime Type | Badge | Primary Specialization |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Liquid AI LFM2.5 350M** | Liquid AI | 354M | Q8_0 | 379 MB | `OLLAMA` | `[EXTRACTION]` | Structured data extraction, classification, lightweight tool routing |
| **RWKV-7 0.4B** | RWKV | 450M | Q8_0 | 501 MB | `OLLAMA` | `[TEXT]` | Fast RNN text generation, rewriting, simple summarization, fallback |
| **TinyLlama 1.1B** | TinyLlama | 1.1B | Q4_0 | 637 MB | `OLLAMA` | `[GENERAL]` | Lightweight general chat, short rewriting, simple Q&A |
| **Stable LM 2 1.6B** | Stability AI | 1.6B | Q4_0 | 982 MB | `OLLAMA` | `[GENERAL]` | General text generation, summarization, multilingual text |

---

## 3. Strict Sovereign Air-Gap & Hardware Isolation

1. **Zero Cloud Egress**: All runtimes (Ollama on port 11434, Python compute on port 8305) execute 100% on the local Intel CPU with 0 outbound network requests.
2. **Zero VRAM Consumption**: All 5 CPU models run with 0 GPU layers offloaded, guaranteeing 0 MB allocated on the RTX 2050 GPU.
3. **Trace Truthfulness**: The UI telemetry and backend trace accurately report the actual model engine, provider, runtime type, CPU execution, and 0 external calls.
