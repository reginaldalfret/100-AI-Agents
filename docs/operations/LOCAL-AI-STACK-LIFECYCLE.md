# Windows Local AI Stack Lifecycle & Auto-Recovery Architecture

> **Platform:** Sovereign AI Workbench (101 Super AI Agents)  
> **Problem Statement ID:** SIH 26117 — Mangalore Refinery and Petrochemicals Limited (MRPL)  
> **Target System:** Windows x64 (Air-Gapped, NVIDIA RTX 2050 4GB VRAM)

---

## 1. Lifecycle Architecture

```
WINDOWS STARTUP / USER LOGON
             │
             ▼
[Windows Scheduled Task: 101-Super-AI-Agents-Local-Stack]
             │
             ▼
[Authoritative Supervisor (scripts/supervisor.js)]
             │
   ┌─────────┼─────────────────────────┐
   │ Priority 1                        │ Priority 2                      │ Priority 3
   ▼                                   ▼                                 ▼
[Ollama Service]              [Python Compute Microservice]    [Node.js Platform Gateway]
(127.0.0.1:11434)             (127.0.0.1:8305)                 (127.0.0.1:8300)
- Gemma 3 (Vision)            - Document Layout & Tables       - Agent Runtime (101 Agents)
- Nemotron 3 (Reasoning)      - OCR & Handwriting              - Multi-Agent Orchestrator
- Qwen 2.5 Coder (Coding)     - P&ID Normalization             - Hybrid RAG Subsystem
                              - Deterministic API-653 Math     - Web UI & Token Streaming
                                                               - Artifact Workspace
```

---

## 2. Windows Management Commands

All lifecycle scripts are located in `scripts/windows/`:

| Script | Purpose |
|---|---|
| `install-local-stack.ps1` | Registers Scheduled Task, initializes runtime state, and starts all services |
| `start-local-stack.ps1` | Starts missing stack services in dependency order |
| `stop-local-stack.ps1` | Gracefully terminates managed processes by PID/port |
| `restart-local-stack.ps1` | Safely restarts Gateway and Python while preserving Ollama models in VRAM |
| `status-local-stack.ps1` | Displays detailed formatted status of all services, models, and GPU |
| `health-local-stack.ps1` | Active health probe returning exit code 0 (Healthy) or 1 (Unhealthy) |
| `repair-local-stack.ps1` | Resolves port conflicts, clears stale PID locks, and restarts services |
| `uninstall-local-stack.ps1` | Unregisters Scheduled Task cleanly without touching application data |
