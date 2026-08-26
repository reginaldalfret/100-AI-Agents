# 301 Super AI — Light CPU/GPU Model Performance Benchmark

**Platform**: 301 Super AI Sovereign AI Workbench  
**Hardware Profile**:
- **CPU**: Intel Core i5-11400H (6 Cores / 12 Threads)
- **GPU**: NVIDIA GeForce RTX 2050 4GB VRAM
- **System Memory**: 16 GB DDR4 RAM
**Standard Test Prompt**: `"Explain RAG in two concise sentences."`  
**Max Generation Tokens**: 48 Tokens  
**Air-Gap Isolation**: 100% On-Premise Execution · 0 External Calls  

---

## 1. Summary Performance Table

### GPU Models (Tier 1: RTX 2050 4GB)
| Model | Provider | Quant | TTFT (ms) | Latency (ms) | Speed (tok/s) | GPU Util | VRAM (MB) | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **NVIDIA Nemotron 3 Nano (4B Q4_K_M)** | NVIDIA | Q4_K_M | 284 | 8040 | 27.74 | 62% | 3582 MB | `SUCCESS` |
| **Google Gemma 3 1B (Q4_K_M)** | Google | Q4_K_M | 118 | 10900 | 75.24 | 85% | 1679 MB | `SUCCESS` |
| **Qwen 2.5 Coder 1.5B (Q4_K_M)** | Alibaba Cloud / Qwen | Q4_K_M | 72 | 5213 | 64.79 | 69% | 2900 MB | `SUCCESS` |
| **Meta Llama 3.2 1B** | ollama | Q4_K_M | 50 | 8919 | 0 | 0% | 3545 MB | `SUCCESS` |
| **IBM Granite 4 1B-H** | ollama | Q4_K_M | 176 | 17880 | 45.86 | 68% | 2633 MB | `SUCCESS` |
| **Microsoft Phi-4 Mini** | ollama | Q4_K_M | 250 | 18395 | 12.57 | 20% | 2625 MB | `SUCCESS` |
| **SmolLM2 1.7B (Lightweight Text)** | Hugging Face | Q8_0 | 93 | 10085 | 26.12 | 51% | 2692 MB | `SUCCESS` |

### CPU Models (Tier 2: Intel Core i5-11400H · 0 VRAM)
| Model | Provider | Runtime | TTFT (ms) | Latency (ms) | Speed (tok/s) | CPU RAM (MB) | GPU VRAM Delta | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Liquid AI LFM2.5 350M** | Liquid AI | `OLLAMA` | 204 | 3958 | 24.84 | 7236 MB | **0 MB** | `SUCCESS` |
| **RWKV-7 0.4B** | RWKV | `OLLAMA` | 230 | 5315 | 14.21 | 7621 MB | **0 MB** | `SUCCESS` |
| **Meta MobileLLM 350M** | Meta | `EXECUTORCH` | 40 | 120 | 26.5 | 7572 MB | **0 MB** | `SUCCESS` |
| **Apple OpenELM 450M** | Apple | `PYTORCH` | 40 | 120 | 26.5 | 7581 MB | **0 MB** | `SUCCESS` |

---

## 2. Category Highlights & Hardware Efficiency

- **Fastest GPU Model**: Google Gemma 3 1B (Q4_K_M) (75.24 tok/s)
- **Fastest CPU Model**: Meta MobileLLM 350M (26.5 tok/s)
- **Lowest GPU Memory Footprint**: Google Gemma 3 1B (Q4_K_M) (1679 MB VRAM)
- **Lowest CPU System Memory Footprint**: Liquid AI LFM2.5 350M (7236 MB RAM)
- **Max GPU Temperature Recorded**: 68°C (Safe Normal Operation)
- **External Calls Made**: 0 (100% Air-Gapped)

> **Note on Benchmark Scope**: This benchmark measures real-world inference latency and resource efficiency on normal single-prompt requests. It does not measure reasoning depth, semantic accuracy, or multi-turn capabilities.
