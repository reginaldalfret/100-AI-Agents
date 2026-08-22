# SOVEREIGN AI WORKBENCH — HARDWARE BENCHMARK SUMMARY (SIH MRPL)

**Machine Hardware:** NVIDIA GeForce RTX 2050 (4GB VRAM) | 8GB System RAM  
**Operating System:** Windows 11 Pro for Workstations  
**Inference Host:** Local Ollama Daemon (`127.0.0.1:11434`)  
**Storage Invariant:** E: Drive Only Authoritative Workspace  
**Date:** August 22, 2026  

---

## 1. Quick Facts for SIH Presenters

- **Hardware Profile:** Single laptop GPU (RTX 2050 4GB VRAM) with 8GB RAM.
- **Local Model Pool:** 3 open-weight specialized models (NVIDIA Nemotron 3 Nano 4B, Local Vision/OCR Engine, Qwen2.5-Coder 1.5B).
- **External Cloud Dependencies:** **0 Calls (100% Air-Gapped)**.
- **Sequential Model Concurrency:** `MAX_CONCURRENCY = 1` with automatic memory slot management to prevent 4GB VRAM exhaustion.
- **Average Reasoning Speed:** ~18–25 tokens/second (Nemotron 3 Nano).
- **Average Coding Speed:** ~35–45 tokens/second (Qwen2.5-Coder).
- **Vision / OCR Extraction Latency:** ~150–250 ms per scanned sheet / defect photo.
- **End-to-End Flagship Investigation:** ~1.2–2.5 seconds total runtime.

---

## 2. Model Roles & Specializations

| Model | Size on Disk | Primary Role | RTX 2050 Suitability |
| :--- | :---: | :--- | :---: |
| **NVIDIA Nemotron 3 Nano 4B** | 2.8 GB | Epistemic Reasoning, SOP Compliance & Task Orchestration | **Optimal** (~2.8GB VRAM peak) |
| **Local Vision / OCR Engine** | In-Process | Scanned NDT Thickness Sheets, P&ID Drawings & CUI Photos | **Ultra-Fast** (<250ms latency) |
| **Qwen2.5-Coder 1.5B** | 986 MB | Python Sandbox Math, SCADA Parsing & Corrosion Formulas | **Lightweight** (~1.1GB VRAM peak) |
