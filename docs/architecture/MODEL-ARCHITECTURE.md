# 301 Super AI — Production Model Stack Architecture

**Product**: 301 Super AI — Sovereign AI Workbench  
**Platform**: On-Premise Industrial AI System  
**Hardware Baseline**: NVIDIA RTX 2050 (4 GB VRAM), 16 GB System RAM, Windows 10/11 x64  
**Air-Gap Guarantee**: 100% On-Premise Execution · 0 External Network Calls

---

## 1. Production Model Stack & Specializations

| Subsystem / Model | Canonical Runtime Tag | Primary Specialization | Memory Footprint | Air-Gap Mode |
| :--- | :--- | :--- | :--- | :--- |
| **NVIDIA Nemotron 3 Nano** | `nemotron-3-nano:latest` | **Super AI Orchestration & Epistemic Reasoning**<br>Autonomous task decomposition, epistemic verification, multi-agent synthesis | 2.8 GB VRAM / Q4_K_M | Local Ollama |
| **Qwen 2.5 Coder 1.5B** | `qwen2.5-coder:1.5b` | **Coding & Deterministic Sandbox Execution**<br>Python, C++, Java, JS, Rust, SQL, AST parsing & refactoring | 986 MB VRAM / Q4_K_M | Local Ollama |
| **Google Gemma 3 1B** | `gemma3:1b` | **Edge NLP & Semantic Synthesis**<br>High-throughput dense transformer, syntactic parsing, semantic summarization | 815 MB / Q4_K_M | Local Ollama |
| **Meta Llama 3.2 1B** | `llama3.2:1b` | **Fast Lightweight General Text**<br>Low-latency rewriting, summarization, simple Q&A, fast responses | 1.3 GB VRAM / Q4_K_M | Local Ollama |
| **IBM Granite 4 1B-H** | `granite4:1b-h` | **Enterprise RAG, Extraction & Tool-Use**<br>Structured extraction, classification, tool invocation, enterprise workflows | 1.2 GB VRAM / Q4_K_M | Local Ollama |
| **Microsoft Phi-4 Mini** | `phi4-mini` | **Reasoning, Mathematics & Logic**<br>Algorithmic problem solving, mathematical proofs, deductive logic, planning | 2.4 GB VRAM / Q4_K_M | Local Ollama |
| **OCR & Document Intelligence** | `python-compute-ocr` | **Primary Image / PDF Structural Extraction**<br>PyMuPDF, Tesseract OCR, Table Transformer, P&ID symbol detection | CPU / RAM (8305) | Python Compute |
| **Faster-Whisper Tiny** | `tiny.en` | **100% Offline Speech-to-Text (Voice Input)**<br>Local audio capture, int8 CPU inference, zero cloud streaming | 78 MB RAM | Local Python / ONNX |

---

## 2. Dedicated Document Intelligence Pipeline

Because **Gemma 3 1B** and lightweight models are strictly text-only, all images, scanned engineering drawings, and PDFs are processed through the dedicated high-performance OCR engine:

```
Scanned Document / Engineering PDF
             │
             ▼
┌──────────────────────────────────────────────┐
│ Stage 1: Dedicated OCR & Document Engine     │
│ (PyMuPDF / Tesseract / Structured Tables)    │
│ • Deterministic character extraction         │
│ • Spatial bounding boxes & tabular alignment │
│ • P&ID instrument tag isolation              │
└──────────────────────┬───────────────────────┘
                       │ Structured Character Evidence
                       ▼
┌──────────────────────────────────────────────┐
│ Stage 2: Gemma 4 E2B / Nemotron 3 Nano       │
│ • Deep semantic interpretation               │
│ • Evidence synthesis & hazard assessment     │
│ • Engineering recommendation drafting        │
└──────────────────────────────────────────────┘
```

---

## 3. GPU Scheduling & Concurrency Safety

- **Max GPU Concurrency**: $1$ (Strict single active CUDA kernel execution to prevent VRAM thrashing on 4 GB GPUs).
- **Graceful Warm-Resident Fallback**: Models stay resident in Ollama memory with automatic eviction upon priority swap.
