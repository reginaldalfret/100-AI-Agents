# 301 Super AI — Hardware-Tiered Model Architecture (GPU vs CPU)

**Product**: 301 Super AI — Sovereign AI Workbench  
**Platform**: On-Premise Industrial AI System  
**Hardware Profile**: 
- **CPU**: Intel Core i5-11400H (6 Cores / 12 Logical Processors)
- **GPU**: NVIDIA GeForce RTX 2050 (4 GB VRAM)
- **System Memory**: 16 GB DDR4 RAM
**Air-Gap Guarantee**: 100% On-Premise Execution · 0 External Network Calls

---

## 1. Hardware Tiering Overview

To maximize resource efficiency and guarantee absolute zero VRAM overflow on 4GB NVIDIA RTX 2050 GPUs, 301 Super AI implements a **dual-tier hardware execution model**:

```
                                MODEL SELECTOR / REGISTRY
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │                                             │
             GPU MODEL TIER                                CPU MODEL TIER
     (execution_target: "GPU")                      (execution_target: "CPU")
  ┌─────────────────────────────────┐           ┌─────────────────────────────────┐
  │ • NVIDIA Nemotron 3 Nano        │           │ • Liquid AI LFM2.5 350M         │
  │ • Qwen 2.5 Coder 1.5B           │           │   (LiquidAI/lfm2.5-350m:latest) │
  │ • IBM Granite 4 1B-H            │           │ • Future CPU Models             │
  │ • Microsoft Phi-4 Mini          │           │   (auto-rendered via registry)  │
  │ • Meta Llama 3.2 1B             │           └────────────────┬────────────────┘
  │ • Google Gemma 3 1B             │                            │
  │ • SmolLM2 1.7B                  │                            │
  └────────────────┬────────────────┘                            │
                   │ Lock (RTX 2050 Mutex)                       │ Lock-Free / Parallel
                   ▼                                             ▼
          NVIDIA RTX 2050 (4GB)                        Intel Core i5-11400H
        num_gpu: default (CUDA)                        num_gpu: 0 (100% CPU)
```

---

## 2. Production Model Inventory by Tier

### Tier 1: GPU Models (`execution_target: "GPU"`)
All GPU models are managed under a strict single-model concurrency mutex (`MAX_GPU_CONCURRENCY = 1`) on the RTX 2050 4GB GPU:

| Model | Ollama Tag | Parameters | Quantization | Size | VRAM Footprint | Specialization |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **NVIDIA Nemotron 3 Nano** | `nemotron-3-nano:latest` | 3.8B | Q4_K_M | 2.8 GB | ~2.8 GB | Super AI Orchestration, deep reasoning |
| **Qwen 2.5 Coder 1.5B** | `qwen2.5-coder:1.5b` | 1.5B | Q4_K_M | 986 MB | ~1.2 GB | Multi-language code synthesis & AST tools |
| **Google Gemma 3 1B** | `gemma3:1b` | 1.0B | Q4_K_M | 815 MB | ~1.1 GB | Dense transformer edge NLP & summarization |
| **Meta Llama 3.2 1B** | `llama3.2:1b` | 1.2B | Q4_K_M | 1.3 GB | ~900 MB | Fast general text & conversational prompts |
| **IBM Granite 4 1B-H** | `granite4:1b-h` | 1.0B | Q4_K_M | 1.4 GB | ~1.1 GB | Enterprise RAG, structured tool execution |
| **Microsoft Phi-4 Mini** | `phi4-mini` | 3.8B | Q4_K_M | 2.5 GB | ~2.6 GB | STEM reasoning, mathematical logic |
| **SmolLM2 1.7B** | `smollm2:1.7b` | 1.7B | Q8_0 | 1.8 GB | ~1.8 GB | High-throughput compact text transformation |

### Tier 2: CPU-Only Models (`execution_target: "CPU"`)
CPU-only models run strictly on the Intel Core i5-11400H CPU with `num_gpu: 0` (0 GPU layers offloaded), allocating 0 MB of GPU VRAM:

| Model | Ollama Tag | Parameters | Quantization | Size | RAM Footprint | VRAM | Specialization |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Liquid AI LFM2.5 350M** | `LiquidAI/lfm2.5-350m:latest` | 354M | Q8_0 | 379 MB | ~466 MB | **0 MB** | Lightweight CPU data extraction, structured output, classification, tool routing |

---

## 3. CPU Execution Enforcement & Telemetry Proof

When any CPU-only model is invoked, the platform streamer (`platform/models/model-streamer.js`) and gateway enforce:

1. **Option Guard**: `options: { num_gpu: 0 }` is attached to all Ollama payload requests.
2. **Lock Bypass**: CPU models do not block GPU inference, allowing parallel CPU processing.
3. **Execution Telemetry**:
   - `Execution: CPU ONLY`
   - `Hardware Compute: Intel Core i5-11400H`
   - `GPU: NOT USED (0 MB VRAM Allocated)`
   - `0 External Calls (Air-Gapped Sovereign Stream)`

---

## 4. Extensibility: Adding Future CPU Models

The UI and backend are completely **data-driven**:
- Adding a new CPU model only requires registering its definition in `platform/models/model-registry.js` and `platform/web/app.js` with `execution_target: "CPU"`.
- The UI dynamically categorizes and renders it into the **CPU LLM** section without requiring any template refactoring.
