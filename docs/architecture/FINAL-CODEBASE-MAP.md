# Final Codebase Architecture Map

**Project**: 301 Super AI Agents  
**Platform**: Sovereign AI Workbench (SIH 26117)  
**Execution Environment**: Local Windows 11 Pro — NVIDIA GeForce RTX 2050 (4GB VRAM) — Air-Gapped

---

## 1. End-to-End Execution Flow

```
                                  ┌───────────────────────────────┐
                                  │   USER (Browser / Desktop)   │
                                  └───────────────┬───────────────┘
                                                  │ HTTP / SSE (/api/chat)
                                                  ▼
                        ┌───────────────────────────────────────────────────┐
                        │      CENTRAL GATEWAY (Port 8300)                  │
                        │      platform/gateway/src/server.js               │
                        └─────────┬───────────────────────────────┬─────────┘
                                  │                               │
            Single Specialist     │                               │ Multi-Agent Workflow
            Direct Execution      │                               │
                                  ▼                               ▼
      ┌───────────────────────────────────────┐ ┌───────────────────────────────────────┐
      │ SPECIALIST AGENT (001–300)            │ │ 301 SUPER AI AGENT                    │
      │ agents/agent-XXX/                     │ │ platform/workflow-engine/             │
      └───────────────────┬───────────────────┘ └───────────────────┬───────────────────┘
                          │                                         │ Plan -> Decompose
                          │                                         ▼
                          │                     ┌───────────────────────────────────────┐
                          │                     │ SPECIALIST SUBTASK DISPATCH           │
                          │                     │ (C++, Java, Python / HTML, CSS, JS)   │
                          │                     └───────────────────┬───────────────────┘
                          │                                         │
                          └───────────────────┬─────────────────────┘
                                              │
                                              ▼
                        ┌───────────────────────────────────────────┐
                        │  RESOURCE SCHEDULER (Single GPU Mutex)    │
                        │  platform/workflow-engine/resource-sched  │
                        └─────────────────────┬─────────────────────┘
                                              │
                                              ▼
                        ┌───────────────────────────────────────────┐
                        │  LOCAL OLLAMA INFERENCE (Port 11434)      │
                        │  Qwen 2.5 Coder / Nemotron 3 / Gemma 3    │
                        └─────────────────────┬─────────────────────┘
                                              │
                                              ▼
                        ┌───────────────────────────────────────────┐
                        │  WORKFLOW RESULT VALIDATOR & ARTIFACTS    │
                        │  AST Validation + SHA-256 Provenance      │
                        └─────────────────────┬─────────────────────┘
                                              │
                                              ▼
                        ┌───────────────────────────────────────────┐
                        │  301 SUPER AI SYNTHESIS & BACKEND TRACE   │
                        │  Universal Hardware Info + Multi-Code     │
                        └─────────────────────┬─────────────────────┘
                                              │
                                              ▼
                        ┌───────────────────────────────────────────┐
                        │  LIQUID GLASS WORKBENCH UI                │
                        │  Real-Time SSE Event Render + Voice Audio │
                        └───────────────────────────────────────────┘
```
