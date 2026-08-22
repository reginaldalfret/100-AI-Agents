# SOVEREIGN AI WORKBENCH — SYSTEM CLEANUP & AUDIT REPORT

**Project:** Sovereign AI Workbench  
**Primary Project Location:** `E:\Smart Automation\100-AI-Agents`  
**Authoritative Storage:** `E:\Smart Automation\`  
**Active Local Website:** `http://127.0.0.1:8300/`  
**Active Public Website:** `https://smartauto.reginaldalfret.tech`  
**Hardware Profile:** Windows 11 | NVIDIA RTX 2050 4GB | 8GB RAM  
**Execution Date:** 2026-08-22  

---

## 1. Executive Summary

A comprehensive, non-destructive audit and targeted cleanup of Windows background processes, listening network ports, scheduled tasks, and startup entries was conducted on the host machine. 

All core Sovereign AI Workbench infrastructure, local LLM engines (Ollama, Nemotron), 101-agent workforce fleet, local gateway, and Cloudflare public tunnel edge were preserved and validated with 100% test passage (25/25 SIH test suites, 101/101 agents passing).

---

## 2. Before vs. After Comparative Metrics

| Metric | Before Cleanup | After Cleanup | Change / Impact |
| :--- | :--- | :--- | :--- |
| **Node.js Production Workers** | 0 (Offline on reboot) | 2 (`supervisor.js`, `server.js`) | +2 (Fully Active & Supervised) |
| **Obsolete PHP Dev Servers** | 2 (`php.exe` PIDs 8636, 20072) | 0 | -2 (Terminated & Port Released) |
| **Dead Scheduled Tasks** | 1 (`BankFraudDetection_CloudflareTunnel`) | 0 | -1 (Unregistered cleanly) |
| **Stale Startup Scripts** | 1 (`DailyGurusERP-start.bat`) | 0 | -1 (Removed from Startup) |
| **Blocked Non-Project Ports** | Port 8000 Occupied | Port 8000 Free | Port 8000 Released |
| **Sovereign Local Gateway (8300)**| Offline | **HTTP 200 (Active)** | Restored to Healthy Production |
| **Public Edge (smartauto...)** | HTTP 502 (Bad Gateway) | **HTTP 200 (Active)** | Edge Ingress Routing Verified |
| **Ollama Local LLM (11434)** | HTTP 200 (Healthy) | **HTTP 200 (Healthy)** | Preserved Intact (4 Models) |
| **101-Agent Fleet Test** | Unverified | **101/101 Passed (100%)** | Full Regression Passed in 11.64s |
| **SIH Platform Test Suites** | Unverified | **25/25 Passed (100%)** | 0 Cloud Egress / 100% Air-Gapped |

---

## 3. Detailed Actions Performed

### A. Obsolete Processes Terminated
1. **PID 8636 (`php.exe`)**: Terminated via `Stop-Process -Id 8636 -Force`. Stale DailyGurus dev server running against `E:\DG - Price List`.
2. **PID 20072 (`php.exe`)**: Terminated via `Stop-Process -Id 20072 -Force`. Child worker holding port `8000`.

### B. Obsolete Startup Entries Removed
1. **`DailyGurusERP-start.bat`**: Removed from `$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\DailyGurusERP-start.bat`. Pointed to missing `E:\ERP2\DailyGurusERP\start-serve.ps1`.

### C. Obsolete Scheduled Tasks Unregistered
1. **`BankFraudDetection_CloudflareTunnel`**: Unregistered via `Unregister-ScheduledTask -TaskName "BankFraudDetection_CloudflareTunnel" -Confirm:$false`. Pointed to non-existent script `E:\Fraud-Detection-System-using-Machine-Learning\start_tunnel.ps1`.

### D. Preserved Authoritative Infrastructure
1. **Sovereign Gateway & Supervisor**: Task Scheduler `SA-S03-Educational-Platform` auto-starts `scripts/start-production.ps1` at logon (`node scripts/supervisor.js` $\rightarrow$ `node platform/gateway/src/server.js` on port `8300`).
2. **Cloudflare Ingress Service**: Windows Service `Cloudflared` running `C:\Cloudflared\cloudflared.exe` with config `C:\Users\ASUS\.cloudflared\config.yml` routing `smartauto.reginaldalfret.tech` to `http://127.0.0.1:8300`.
3. **Ollama Local LLM Daemon**: Running on `http://127.0.0.1:11434` with models: `gemma3:4b`, `gemma2:2b`, `qwen2.5-coder:1.5b`, `nemotron-3-nano:latest`.
4. **Nemotron 4B Local AI Service**: Task Scheduler `NemotronLocalAIService` running watchdog on `E:\LocalAI\` with full RTX 2050 CUDA layer offload on port `8088`.
5. **PostgreSQL 18**: Local service on port `8080` for structured data persistence.

---

## 4. Current Active Process Allowlist

| PID | Name | Command Line | Role |
| :--- | :--- | :--- | :--- |
| **15096** | `powershell.exe` | `powershell.exe -File "E:\Smart Automation\100-AI-Agents\scripts\start-production.ps1"` | Production Launcher Daemon |
| **5128** | `node.exe` | `node scripts/supervisor.js` | Sovereign AI Supervisor |
| **416** | `node.exe` | `node E:\Smart Automation\100-AI-Agents\platform\gateway\src\server.js` | Sovereign Gateway (Port 8300) |
| **19280** | `ollama.exe` | `ollama.exe serve` | Ollama Engine (Port 11434) |
| **13656** | `cloudflared.exe`| `cloudflared.exe --config ... tunnel run dailygurus-pricelist` | Cloudflare Edge Ingress |
| **11676** | `llama-server.exe`| `llama-server.exe -m NVIDIA-Nemotron3-Nano-4B-Q4_K_M.gguf -ngl 32` | Nemotron 4B Local CUDA Server |

---

## 5. Current Active Port Allowlist

| Port | Protocol | Binding | Service / Process | Owner / Script | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **8300** | TCP | `0.0.0.0` / `127.0.0.1` | `node.exe` (PID 416) | `platform/gateway/src/server.js` | Sovereign AI Workbench UI & API |
| **11434**| TCP | `127.0.0.1` | `ollama.exe` (PID 19280) | `ollama.exe serve` | Ollama Local LLM API |
| **8088** | TCP | `127.0.0.1` | `llama-server.exe` (PID 11676) | `E:\LocalAI\scripts\start_server.ps1` | Nemotron 4B Local CUDA API |
| **20241**| TCP | `127.0.0.1` | `cloudflared.exe` (PID 13656) | Windows Service `Cloudflared` | Cloudflare Tunnel Metrics |
| **8080** | TCP | `0.0.0.0` | `postgres.exe` (PID 6884) | PostgreSQL 18 Service | Database Persistence |

---

## 6. Files and Source Code Intentionally Preserved

1. **`E:\Smart Automation\`**: 100% intact (all agents, registry, state, logs, docs, artifacts).
2. **`E:\LocalAI\`**: 100% intact (Nemotron models, runtime, scripts, benchmarks).
3. **`E:\Fraud Detection`**: Source preserved on disk (only dead scheduled task trigger pointing to old path was removed).
4. **`E:\DG - Price List`**: Source preserved on disk (only dead startup batch file and background dev server were stopped).

---

## 7. Verification Results

- **Local Web Interface**: `http://127.0.0.1:8300/` $\rightarrow$ **HTTP 200 OK** (17.2 KB payload)
- **Public Web Interface**: `https://smartauto.reginaldalfret.tech` $\rightarrow$ **HTTP 200 OK** (17.6 KB payload)
- **Ollama API**: `http://127.0.0.1:11434/api/tags` $\rightarrow$ **HTTP 200 OK** (`gemma3:4b`, `gemma2:2b`, `qwen2.5-coder:1.5b`, `nemotron-3-nano:latest`)
- **Fleet Regression**: `101/101 Passed (100.0%)` in 11.64s
- **SIH Test Suite**: `25/25 Test Suites Passed (100% Pass Rate, 0 Cloud Egress)`
- **Auto-Start On Boot**: Task `SA-S03-Educational-Platform` armed and verified.
