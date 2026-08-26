# 301 Super AI — Local Model Architecture & Hardware Tiering

**Platform**: 301 Super AI Sovereign AI Workbench  
**Hardware Specifications**:
- **CPU**: Intel Core i5-11400H (6 Cores / 12 Threads)
- **GPU**: NVIDIA GeForce RTX 2050 (4 GB VRAM)
- **System Memory**: 16 GB DDR4 RAM
**Air-Gap Guarantee**: 100% On-Premise Execution · 0 External Network Calls

---

## 1. Complete Dual-Tier Local Model Stack

### Tier 1: GPU Models (RTX 2050 4GB · Concurrency Mutex Protected)
| Model | Tag | Parameters | Quantization | Size | VRAM | Specialization |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **NVIDIA Nemotron 3 Nano** | `nemotron-3-nano:latest` | 3.8B | Q4_K_M | 2.8 GB | ~2.8 GB | Master Orchestration & Reasoning |
| **Qwen 2.5 Coder 1.5B** | `qwen2.5-coder:1.5b` | 1.5B | Q4_K_M | 986 MB | ~1.2 GB | Multi-Language Code Synthesis & AST |
| **Google Gemma 3 1B** | `gemma3:1b` | 1.0B | Q4_K_M | 815 MB | ~1.1 GB | Dense Transformer Edge NLP |
| **Meta Llama 3.2 1B** | `llama3.2:1b` | 1.2B | Q4_K_M | 1.3 GB | ~900 MB | Fast Lightweight General Text |
| **IBM Granite 4 1B-H** | `granite4:1b-h` | 1.0B | Q4_K_M | 1.4 GB | ~1.1 GB | Enterprise RAG & Tool Execution |
| **Microsoft Phi-4 Mini** | `phi4-mini` | 3.8B | Q4_K_M | 2.5 GB | ~2.6 GB | STEM Reasoning & Mathematical Logic |
| **SmolLM2 1.7B** | `smollm2:1.7b` | 1.7B | Q8_0 | 1.8 GB | ~1.8 GB | High-Throughput Reasoning & Transformation |
| **Falcon3 1B** | `falcon3:1b-instruct-q4_K_M` | 1.67B | Q4_K_M | 1.1 GB | ~1.3 GB | Science, Mathematics & Lightweight Coding |

### Tier 2: CPU Models (Intel Core i5-11400H · 0 GPU VRAM · Multi-Runtime)
| Model | Checkpoint | Provider | Size | Runtime | Badge | Specialization |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Liquid AI LFM2.5 350M** | `LiquidAI/lfm2.5-350m:latest` | Liquid AI | 379 MB | `Ollama` | `[EXTRACTION]` | Data extraction, structured output, tool routing |
| **RWKV-7 0.4B** | `mollysama/rwkv-7-g1d:0.4b` | RWKV | 501 MB | `Ollama` | `[TEXT]` | Low-latency RNN text generation & summary |
| **TinyLlama 1.1B** | `tinyllama:1.1b-chat` | TinyLlama | 637 MB | `Ollama` | `[GENERAL]` | Lightweight general chat, short rewriting & simple Q&A |
| **Stable LM 2 1.6B** | `stablelm2:1.6b` | Stability AI | 982 MB | `Ollama` | `[GENERAL]` | General text generation, summarization & rewriting |
| **PaddleOCR 3.7.0 Engine** | `paddleocr-engine` | PaddleOCR | 62 MB | `ONNX` | `[OCR]` | Production Offline Document Intelligence |
| **Faster-Whisper Tiny** | `tiny.en` | SYSTRAN | 78 MB | `ONNX` | `[VOICE]` | 100% Offline Speech-to-Text |
