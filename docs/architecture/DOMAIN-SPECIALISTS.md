# Domain Specialist LLMs Architecture

## Overview

The 301 Super AI Platform features specialized Domain Specialist LLMs designed to provide deep expertise in targeted vertical domains with high accuracy, speed, and safety.

Domain Specialist models are partitioned into their own dedicated section in the platform architecture and user interface: **`🟣 DOMAIN SPECIALIST LLMs`**.

---

## Registered Domain Specialists

### 1. MedGemma 4B (Healthcare & Medical AI)
* **Model ID**: `medgemma-4b`
* **Exact Ollama Model**: `medgemma:4b-it-q4_K_M`
* **Provider**: Google (Health AI Developer Foundations)
* **Base Architecture**: `gemma3`
* **Parameters**: 4.3B
* **Quantization**: Q4_K_M
* **Model Size**: ~3.3 GB
* **Context Length**: 131,072 (128K)
* **Input Modalities**: Text + Vision (Multimodal Image)
* **Execution Target**: GPU (RTX 2050 4GB with ~2.7 GB VRAM footprint)
* **Primary Tag**: `[HEALTHCARE]`
* **Secondary Tag**: `[MEDICAL AI]`
* **Capabilities**:
  * Medical and clinical text comprehension
  * Medical explanation & educational decision-support
  * Multimodal medical image interpretation (X-ray, scans, pathology diagrams)
  * Clinical symptom analysis & risk factor breakdown
  * ECG and physiological signal concept explanation
* **Medical Safety & Human Oversight Notice**:
  > *For informational/decision-support use only. Not a substitute for a qualified healthcare professional or autonomous clinical diagnosis.*

---

### 2. Qwen3 1.7B Cyber (Cybersecurity & SOC/DFIR)
* **Model ID**: `qwen3-1.7b-cyber`
* **Exact Ollama Model**: `babar_jamali/qwen3-1.7b-cyber:latest`
* **Provider**: Babar Ali Jamali (Community Fine-Tuned Model)
* **Base Architecture**: `qwen3`
* **Parameters**: 1.72B
* **Quantization**: Q4_K_M
* **Model Size**: ~1.1 GB
* **Context Length**: 40,960 (40K)
* **Input Modalities**: Text + Code
* **Execution Target**: AUTO_GPU_CPU (RTX 2050 ~1.5 GB VRAM / Intel i5)
* **Primary Tag**: `[CYBERSECURITY]`
* **Secondary Tag**: `[FINE-TUNED]`
* **Capabilities**:
  * OWASP Top 10 vulnerability assessment
  * Authentication log parsing & intrusion detection
  * Secure code review & remediation
  * SOC / DFIR incident analysis
  * High-speed inference (~82.5 tokens/sec)

---

## Routing & Orchestration Matrix

| Task Type | Trigger Keywords / Modalities | Target Model | Fallback |
| :--- | :--- | :--- | :--- |
| **Healthcare / Clinical** | `healthcare`, `medical`, `hypertension`, `diabetes`, `cardiovascular`, `ecg`, `symptom`, `x-ray`, `mri`, `clinical` | `medgemma:4b-it-q4_K_M` | `nemotron-3-nano:latest` |
| **Cybersecurity / Threat** | `cybersecurity`, `owasp`, `sqli`, `xss`, `soc`, `dfir`, `auth log`, `failed login`, `ssh login`, `cve`, `malware` | `babar_jamali/qwen3-1.7b-cyber:latest` | `qwen2.5-coder:1.5b` |
| **Coding & Sandbox** | `python`, `code`, `script`, `algorithm`, `sql query`, `debug`, `regex` | `qwen2.5-coder:1.5b` | `falcon3:1b-instruct-q4_K_M` |
| **General Reasoning** | General chat, SOP synthesis, planning | `nemotron-3-nano:latest` | `llama3.2:1b` |

---

## Air-Gap & Sovereignty Guarantee
Both Domain Specialist models run 100% locally on `127.0.0.1:11434` with zero external calls (`0 External Calls`), preserving complete data privacy for sensitive medical data and security logs.
