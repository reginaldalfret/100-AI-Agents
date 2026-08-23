# Windows Local AI Stack Lifecycle Audit

> **Platform:** Sovereign AI Workbench (101 Super AI Agents)  
> **Host Organization:** Mangalore Refinery and Petrochemicals Limited (MRPL)  
> **Problem Statement ID:** SIH 26117  
> **Date of Audit:** 2026-08-23  

---

## 1. Executive Environment Audit

| Component | Target Location / Spec | Status | Notes |
|---|---|:---:|---|
| **Node.js Runtime** | `C:\Program Files\nodejs\node.exe` | **v24.18.0 Verified** | Fast, high-throughput V8 event loop for Gateway & Multi-Agent Orchestrator |
| **Python Runtime** | `C:\Users\ASUS\AppData\Local\Programs\Python\Python312\python.exe` | **Python 3.12.10 Verified** | Used for local document intelligence, OCR, CV preprocessing, and numeric compute |
| **Ollama Runtime** | `C:\Users\ASUS\AppData\Local\Programs\Ollama\ollama.exe` | **Active / Running** | Manages local LLMs and vision models over localhost `127.0.0.1:11434` |
| **Local Models** | `gemma3:4b`, `nemotron-3-nano:latest`, `qwen2.5-coder:1.5b` | **Installed & Verified** | Strictly local open-weight models |
| **Hardware** | NVIDIA GeForce RTX 2050 (4GB VRAM), 8GB System RAM | **Hardware Guarded** | Single-model concurrency enforcement to prevent VRAM thrashing |
| **Network Egress** | Zero cloud calls (Strict Air-Gap) | **100% On-Premise** | 0 external network requests |

---

## 2. Port & Process Architecture

- **Ollama Engine**: `http://127.0.0.1:11434` (Health: `GET /api/tags`)
- **Python Compute Microservice**: `http://127.0.0.1:8305` (Health: `GET /health`)
- **Node.js Platform Gateway**: `http://127.0.0.1:8300` (Health: `GET /api/health`, `GET /api/system/health`)
- **Local Web Interface**: `http://127.0.0.1:8300/`

---

## 3. Authoritative Lifecycle Decision

- **Supervision Pattern**: Single authoritative Windows Scheduled Task (`101-Super-AI-Agents-Local-Stack`) invoking central Node.js supervisor (`scripts/supervisor.js`).
- **Startup Order**: Ollama -> Python Compute -> Node.js Gateway.
- **Crash Recovery**: Auto-restarts individual failed services with exponential backoff and crash-loop circuit breaker (max 5 restarts / 10 minutes).
