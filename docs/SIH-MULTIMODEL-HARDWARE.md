# SOVEREIGN AI WORKBENCH — HARDWARE & MODEL PLATFORM AUDIT

**Host System:** ASUS Windows Workstation / Laptop  
**Date:** August 22, 2026  
**Auditor:** Sovereign Platform Lead  

---

## 1. Hardware Specifications

| Component | Metric / Specification | Status |
| :--- | :--- | :---: |
| **GPU Model** | NVIDIA GeForce RTX 2050 Laptop GPU | Active |
| **Total VRAM** | 4,096 MiB (4.0 GB) GDDR6 | Verified |
| **Active VRAM Footprint** | ~2,359 MiB (OS Compositor + Background) | Monitored |
| **NVIDIA Driver** | 555.97 | Verified |
| **CUDA Version** | 12.5 | Active |
| **System RAM** | 8.0 GB Physical RAM | Active |
| **Free Disk (E: Drive)** | 95.54 GB Free (Workspace & Deliverables) | Healthy |
| **Free Disk (C: Drive)** | 7.88 GB Free (Ollama Weights Storage) | Monitored |

---

## 2. Ollama Runtime Audit

- **Ollama Binary Version:** `0.32.13`
- **Ollama Endpoint:** `http://127.0.0.1:11434`
- **Installed Primary Reasoning Model:** `nemotron-3-nano:latest` (2.8 GB, Q4_K_M)
- **Active Memory Policy:** Sequential on-demand model lifecycle (`MAX_MODEL_CONCURRENCY=1`) to prevent VRAM overflow.

---

## 3. Target Model Architecture

```
                      USER / TASK
                           │
                           ▼
                  TASK CLASSIFIER & ROUTER
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
      Nemotron 3 Nano   Gemma 3 / Vision  Qwen2.5-Coder
        (Reasoning)       (Multimodal)       (Coding)
             │             │             │
             └─────────────┼─────────────┘
                           ▼
               Agent 101 Sovereign Master
                           ▼
               100 Industrial AI Agents
                           ▼
               Isolated Sandbox & RAG
```
