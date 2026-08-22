# ACTIVE PROCESS ALLOWLIST

**Project:** Sovereign AI Workbench (`E:\Smart Automation\100-AI-Agents`)  
**Maintained By:** Principal System Architect  
**Version:** 1.0.0 (Post-Cleanup Baseline)  

---

## 1. Protected Sovereign AI Workbench Infrastructure

The following processes represent the authoritative production stack and **MUST NEVER BE KILLED OR TERMINATED AUTOMATICALLY**:

### 1. Sovereign AI Supervisor
- **Executable:** `node.exe`
- **Entry Script:** `E:\Smart Automation\100-AI-Agents\scripts\supervisor.js`
- **Role:** Health-monitoring supervisor; monitors and automatically relaunches the 101-agent fleet and API gateway upon failure.
- **Parent Process:** `powershell.exe` (`scripts\start-production.ps1` via Task Scheduler `SA-S03-Educational-Platform`)

### 2. Sovereign AI Gateway
- **Executable:** `node.exe`
- **Entry Script:** `E:\Smart Automation\100-AI-Agents\platform\gateway\src\server.js`
- **Port:** `8300` (Binding: `0.0.0.0:8300` / `127.0.0.1:8300`)
- **Role:** Web UI hosting, REST endpoints, WebSocket streaming, agent coordination, and LLM proxy.

### 3. Ollama Local LLM Engine
- **Executable:** `ollama.exe`
- **Invocation:** `ollama.exe serve`
- **Port:** `11434` (Binding: `127.0.0.1:11434`)
- **Role:** Local LLM model execution (Gemma 3 4B, Gemma 2 2B, Qwen 2.5 Coder 1.5B, Nemotron 3 Nano).

### 4. Cloudflare Edge Ingress Tunnel
- **Executable:** `cloudflared.exe`
- **Service Name:** `Cloudflared` (Windows Service)
- **Role:** High-availability edge ingress routing `https://smartauto.reginaldalfret.tech` directly to `http://127.0.0.1:8300`.

### 5. Local Nemotron 4B AI Service
- **Executable:** `llama-server.exe`
- **Entry Script:** `E:\LocalAI\scripts\nemotron_watchdog.ps1`
- **Port:** `8088` (Binding: `127.0.0.1:8088`)
- **Role:** Full RTX 2050 CUDA layer-accelerated local Nemotron inference.

---

## 2. Protected System & Developer Tooling

- `Antigravity.exe` & `language_server.exe` (Developer IDE and Language Server Protocol)
- `postgres.exe` (PostgreSQL 18 Database Engine)
- `svchost.exe`, `csrss.exe`, `wininit.exe`, `services.exe`, `lsass.exe` (Windows OS Subsystem)
- `NVIDIA Display / Container` daemons (GPU Driver & CUDA Runtime)
