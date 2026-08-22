# SOVEREIGN AI WORKBENCH — HARDWARE BENCHMARK SUMMARY (SIH MRPL)

**Machine Hardware:** NVIDIA GeForce RTX 2050 (4GB VRAM) | 8GB System RAM  
**Operating System:** Windows 11 Pro for Workstations  
**Inference Engine:** Local Ollama Daemon (`127.0.0.1:11434`) + Local Vision Engine  
**Storage Invariant:** E: Drive Only Authoritative Workspace  
**Date:** August 22, 2026  

---

## 1. Quick Facts for SIH Presenters

- **Hardware Profile:** Single laptop GPU (RTX 2050 4GB VRAM) with 8GB RAM.
- **Local Model Fleet:** 
  1. **NVIDIA Nemotron 3 Nano (4B):** Primary Reasoning & Orchestration (35.1 tok/s, 136 ms TTFT).
  2. **Google Gemma 2 (2B):** Visual Defect QA & Equipment Semantics (54.9 tok/s, 40 ms TTFT).
  3. **Qwen 2.5 Coder (1.5B):** Python Sandbox Math & Corrosion Scripting (89.3 tok/s, 12 ms TTFT).
  4. **In-Process Vision & OCR Engine:** High-Throughput Scanned Document & P&ID Processing (61 ms latency).
- **External Cloud Dependencies:** **0 Calls (100% Air-Gapped)**.
- **Peak VRAM Consumption:** Max **3,547 MB** (safely within 4,096 MB VRAM limit).
- **End-to-End Flagship Investigation:** **~750 ms** total runtime.
