# SOVEREIGN AI WORKBENCH — LOCAL MULTI-MODEL ARCHITECTURE

**Project:** Sovereign AI Workbench  
**Problem Statement:** Sovereign On-Premise Agentic AI Workbench using Open-Weight Multimodal LLMs for Confidential Industrial Work  
**Organization:** Mangalore Refinery and Petrochemicals Limited (MRPL)  
**Date:** August 22, 2026  

---

## 1. ARCHITECTURAL PHILOSOPHY
No single AI model excels at every industrial domain while fitting into constrained on-premise hardware. Instead of forcing one model to do everything, the **Sovereign AI Workbench** deploys a specialized triad of open-weight models running on local hardware:

```
                            USER / TASK
                                 │
                                 ▼
                         TASK CLASSIFIER
                                 │
                                 ▼
                        LOCAL MODEL ROUTER
                                 │
             ┌───────────────────┼───────────────────┐
             ▼                   ▼                   ▼
     NVIDIA Nemotron 3 Nano   Gemma 3 / Vision    Qwen2.5-Coder
      (Epistemic Reasoning)     (Multimodal)         (Coding)
             │                   │                   │
             └───────────────────┼───────────────────┘
                                 ▼
                     Agent 101 Master Orchestrator
                                 ▼
                     100 Specialized Industrial Agents
                                 ▼
                     Local Tools, RAG & Sandbox
                                 ▼
                     Air-Gapped Real Deliverables
```

---

## 2. LOCAL MODEL REGISTRY & ROLES

| Model | Role | Modalities | Quantization | VRAM Footprint | Primary Responsibilities |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **NVIDIA Nemotron 3 Nano (4B)** | Epistemic Reasoning | Text / JSON | `Q4_K_M` | 2.99 GB | Orchestration, planning, SOP synthesis, statutory risk assessment, approval note drafting |
| **Google Gemma 3 (4B)** | Multimodal Vision & QA | Text / Image | `Q4_K_M` | 3.10 GB | Visual defect reasoning, P&ID drawing interpretation, equipment photo analysis |
| **Local Vision & OCR Engine** | Document Ingestion & OCR | PDF / Image | `FP16 / Int8` | 0.45 GB | High-speed tabular NDT report digitization, P&ID tag extraction |
| **Qwen2.5-Coder (1.5B)** | Code Generation & Math | Code / Python | `Q4_K_M` | 1.44 GB | Python formula scripts, corrosion rate math, sandbox automation |

---

## 3. RESOURCE-AWARE MODEL LIFECYCLE (RTX 2050 4GB)
- **Bounded Concurrency:** `MAX_MODEL_CONCURRENCY=1` ensures sequential model execution, preventing out-of-memory crashes on 4GB VRAM.
- **On-Demand Memory Allocation:** Inactive model contexts are set to `IDLE` during heavy task transitions.
- **Air-Gap Verification:** Every model endpoint is strictly verified against `127.0.0.1`. Public internet calls are blocked before leaving the socket layer.
