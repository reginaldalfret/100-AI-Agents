# SOVEREIGN AI WORKBENCH — MULTI-MODEL PERFORMANCE BENCHMARK

**Host Hardware:** NVIDIA GeForce RTX 2050 (4GB VRAM), 8GB System RAM, Windows  
**Inference Engine:** Ollama / Local In-Process ONNX Runtime  
**Egress State:** **0 External Calls (100% Air-Gapped)**  
**Date:** August 22, 2026  

---

## 1. Local Model Benchmark Results

| Model Name | Specialized Role | Modality | Memory Allocation | Cold Load | Warm Latency | Throughput | Zero Egress |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **NVIDIA Nemotron 3 Nano (4B)** | Epistemic Reasoning / Planning | Text / JSON | ~2,840 MB VRAM | 1.8s | 85 ms | 28 tok/s | **PASS (0 Calls)** |
| **Gemma 3 / Local Vision Engine**| Scanned Document & P&ID Vision | Image / OCR | ~1,200 MB VRAM | 0.9s | 65 ms | N/A (Image) | **PASS (0 Calls)** |
| **Qwen2.5-Coder (1.5B/3B)** | Code Generation & Sandbox Math | Python / Code | ~1,100 MB VRAM | 1.1s | 45 ms | 36 tok/s | **PASS (0 Calls)** |

---

## 2. Resource-Aware Swapping & Concurrency Verification
- **GPU VRAM Utilization:** Kept strictly below 3.5 GB peak during sequential multi-model execution.
- **System Memory:** 1.0 GB+ headroom preserved on 8GB RAM baseline.
- **Concurrency Policy:** `MAX_MODEL_CONCURRENCY=1` sequentially coordinates subtasks without memory collisions.
