# ACTIVE PORT ALLOWLIST

**Project:** Sovereign AI Workbench (`E:\Smart Automation\100-AI-Agents`)  
**Maintained By:** Principal System Architect  

---

## 1. Production Port Allocation

| Port | Protocol | Binding | Service / Process | Owner / Script | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **8300** | TCP | `0.0.0.0` / `127.0.0.1` | `node.exe` | `platform/gateway/src/server.js` | Sovereign AI Workbench Web UI & API Gateway |
| **11434**| TCP | `127.0.0.1` | `ollama.exe` | `ollama.exe serve` | Ollama LLM Inference Engine |
| **8088** | TCP | `127.0.0.1` | `llama-server.exe` | `E:\LocalAI\scripts\start_server.ps1` | Nemotron-3-Nano-4B Local CUDA Server |
| **8090** | TCP | `127.0.0.1` | `pythonw.exe` | `E:\LocalAI\router\router.py` | Local Multimodal Document & OCR Router |
| **20241**| TCP | `127.0.0.1` | `cloudflared.exe` | Windows Service `Cloudflared` | Cloudflare Tunnel Local Metrics & Routing |
| **8080** | TCP | `0.0.0.0` | `postgres.exe` | PostgreSQL 18 Service | Structured Database Persistence |

---

## 2. Policy for Port Claims

- No background development server may claim ports `8300` or `11434`.
- Unused ports (e.g. `8000`, `3000`, `5000`) must be released after testing sessions.
- All AI endpoints must strictly bind to `127.0.0.1` for local-first privacy.
