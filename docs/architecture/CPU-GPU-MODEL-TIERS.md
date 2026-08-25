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
  │ • NVIDIA Nemotron 3 Nano (2.8GB)│           │ • Liquid AI LFM2.5 350M         │
  │ • Qwen 2.5 Coder 1.5B (986MB)   │           │   (LiquidAI/lfm2.5-350m · 379MB)│
  │ • IBM Granite 4 1B-H (1.4GB)    │           │ • RWKV-7 0.4B                   │
  │ • Microsoft Phi-4 Mini (2.5GB)  │           │   (mollysama/rwkv-7-g1d:0.4b    │
  │ • Meta Llama 3.2 1B (1.3GB)     │           │    · 501MB)                     │
  │ • Google Gemma 3 1B (815MB)     │           │ • Meta MobileLLM-Pro 1B (580MB) │
  │ • SmolLM2 1.7B (1.8GB)          │           │ • Meta MobileLLM 350M (210MB)   │
  └────────────────┬────────────────┘           │ • Apple OpenELM 450M (450MB)    │
                   │ Lock (RTX 2050 Mutex)      └────────────────┬────────────────┘
                   ▼                                             │ Lock-Free / Parallel
          NVIDIA RTX 2050 (4GB)                                  ▼
        num_gpu: default (CUDA)                        Intel Core i5-11400H
                                                       num_gpu: 0 (100% CPU)
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

| Model | Identifier / Checkpoint | Provider | Parameters | Size | Runtime | Badge | Specialization |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Liquid AI LFM2.5 350M** | `LiquidAI/lfm2.5-350m:latest` | Liquid AI | 354M | 379 MB | `Ollama` | `[EXTRACTION]` | Data extraction, structured output, tool routing |
| **RWKV-7 0.4B** | `mollysama/rwkv-7-g1d:0.4b` | RWKV | 450M | 501 MB | `Ollama` | `[TEXT]` | Fast general text, rewriting, summarization |
| **Meta MobileLLM-Pro 1B** | `facebook/MobileLLM-Pro-1B` | Meta Reality Labs | 1.0B | 580 MB | `ExecuTorch` | `[ASSISTANT]` | General on-device assistant, QA, reasoning |
| **Meta MobileLLM 350M** | `facebook/MobileLLM-350M` | Meta | 350M | 210 MB | `ExecuTorch` | `[EDGE]` | Ultra-light edge routing, classification |
| **Apple OpenELM 450M** | `apple/OpenELM-450M-Instruct` | Apple | 450M | 450 MB | `PyTorch` | `[TEXT]` | Layer-wise scaled text summarization |

---

## 3. Extensibility & Scrollable UI Support

- Adding a new CPU or GPU model only requires registering its definition with `execution_target: "CPU"` or `"GPU"`.
- The UI dynamically renders it into the **CPU LLM** or **GPU LLM** section within the scrollable Liquid Glass dropdown (`max-height: 70vh`).
