# SOVEREIGN AI WORKBENCH — LOCAL MODEL INVENTORY

**Runtime:** Ollama / On-Premise Execution Daemon  
**Inference Endpoint:** `http://127.0.0.1:11434`  
**Date:** August 22, 2026  

---

## 1. Local Model Catalog

| Model Identifier | Ollama Tag / Source | Parameters | Quantization | Size on Disk | Role |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `nemotron-3-nano` | `nemotron-3-nano:latest` | 4B | `Q4_K_M` | 2.84 GB | Epistemic Reasoning, Planning & Orchestration |
| `local-vision-ocr` | `local-multimodal / ONNX` | 4B | `FP16 / Int8` | 1.20 GB | Multimodal Vision, Scanned PDF OCR & P&ID Drawings |
| `qwen2.5-coder` | `qwen2.5-coder:1.5b` | 1.5B | `Q4_K_M` | 0.98 GB | Python Automation, Formula Scripting & Code Sandbox |

---

## 2. Air-Gap & Sovereignty Guarantee
All model weights reside physically on local disk. Zero cloud API calls, telemetry packets, or remote fallbacks exist.
