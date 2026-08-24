# 301 Super AI Agents — Windows Local Stack Supervisor

**Platform**: Sovereign AI Workbench (SIH Problem Statement 26117)  
**Location**: `scripts/supervisor.js`  
**Status**: 100% On-Premise Air-Gapped Local Stack Supervisor

---

## 1. Managed Services & Ports

| Service | Port | Endpoint | Role |
| :--- | :--- | :--- | :--- |
| **Ollama Runner** | `11434` | `http://127.0.0.1:11434/api/tags` | GPU LLM Inference (Nemotron, Qwen, Gemma) |
| **Python Compute** | `8305` | `http://127.0.0.1:8305/health` | Document processing, OCR, STT & Analytics |
| **Node Gateway** | `8300` | `http://127.0.0.1:8300/api/health` | Central Gateway, Web UI & Orchestrator |

---

## 2. Hardened Architecture & Reliability Invariants

### 1. Zero Duplicate Process Startup
Before spawning any service, the supervisor:
1. Pings the service health endpoint. If healthy $ightarrow$ sets state to `READY` and reuses the existing process.
2. If the port is listening but unhealthy, checks the process command line. If it is an owned stale process, terminates that specific PID cleanly and restarts. If foreign, reports `PORT_CONFLICT` and enters safe non-destructive state.

### 2. Terminal Crash-Loop Circuit Breaker
- Max failures: **5 attempts in 10 minutes**.
- When threshold is reached, transitions to **`FAILED`** state.
- **Automatic retries are disabled** to prevent infinite restart loops and log spam.
- State transitions are logged **once**.

### 3. Transparent Logging
- Detailed stdout/stderr streams are piped to `runtime/logs/python-compute.log`, `runtime/logs/gateway.log`, and `runtime/logs/supervisor.log`.

---

## 3. Operational PowerShell Tooling

- **Status Check**: `scripts/windows/status-local-stack.ps1`
- **Start Stack**: `scripts/windows/start-local-stack.ps1`
- **Stop Stack**: `scripts/windows/stop-local-stack.ps1`
- **Restart Stack**: `scripts/windows/restart-local-stack.ps1`
- **Repair / Reset**: `scripts/windows/repair-local-stack.ps1`
