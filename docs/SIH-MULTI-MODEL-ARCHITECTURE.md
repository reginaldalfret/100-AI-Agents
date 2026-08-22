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
| **NVIDIA Nemotron 3 Nano (4B)** | Epistemic Reasoning | Text / JSON | `Q4_K_M` | 2.84 GB | Orchestration, planning, SOP synthesis, statutory risk assessment, approval note drafting |
| **Gemma 3 / Local Vision Engine** | Multimodal Vision & OCR | Image / PDF / Drawing | `FP16 / Int8` | 1.20 GB | Scanned NDT report tabular OCR, P&ID drawing tag extraction, CUI corrosion photo analysis |
| **Qwen2.5-Coder (1.5B/3B)** | Code Generation & Debugging | Code / Text / Script | `Q4_K_M` | 1.10 GB | Python formula scripts, telemetry parsers, Excel formulas, sandbox automation |

---

## 3. RESOURCE-AWARE MODEL LIFECYCLE (RTX 2050 4GB)
- **Bounded Concurrency:** `MAX_MODEL_CONCURRENCY=1` ensures sequential model execution, preventing out-of-memory crashes on 4GB VRAM.
- **On-Demand Memory Allocation:** Inactive model contexts are set to `IDLE` during heavy task transitions.
- **Air-Gap Verification:** Every model endpoint is strictly verified against `127.0.0.1`. Public internet calls are blocked before leaving the socket layer.
