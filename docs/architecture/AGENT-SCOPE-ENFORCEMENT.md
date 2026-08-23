# Agent Scope Guard & Domain Boundary Enforcement Architecture

**Platform:** Sovereign AI Workbench  
**Project:** 101 Super AI Agents  
**Runtime:** 100% Local / On-Premise Air-Gapped (NVIDIA RTX 2050 4GB)

---

## 1. Overview & Core Principles

The Agent Scope Guard ensures that specialist AI agents (001–100) operate with domain awareness, capability awareness, and honesty regarding their specialization, while **101 Super AI Agent** functions as the general master orchestrator for complex and cross-domain goals.

```
USER REQUEST ("Write a REST API in Node.js")
    ↓
AGENT SCOPE GUARD (agent-scope-guard.js)
    ↓
PRIMARY INTENT & DOMAIN CLASSIFICATION
    ↓
Is Selected Agent 101 (Super AI)? ── YES ──> [EXECUTE / DELEGATE WORKFORCE]
    ↓ NO
Does Intent match Agent Specialization?
    ├─ YES ──> [EXECUTE LOCAL MODEL STREAM]
    └─ NO  ──> [POLITE SPECIALIST REDIRECTION CARD]
               - Explains current specialization politely
               - Recommends 1–2 best specialist agents (e.g. 046 Backend AI Agent)
               - One-click [ Switch to Backend AI Agent ]
               - Retains original user prompt in composer for review & send
```

---

## 2. Intent-First Classification Rule

The scope guard distinguishes **DOING a task** from **EXPLAINING / LEARNING / WRITING about that topic**:

| Agent | User Prompt | Scope Decision | Rationale |
|---|---|---|---|
| `003 Study AI Agent` | "Write a REST API handler in Node.js" | **OUT OF SCOPE** | Requires backend software development. |
| `003 Study AI Agent` | "Explain Docker for my exam" | **IN SCOPE** | Intent is exam study & conceptual learning. |
| `001 Writing AI Agent` | "Write an article about Kubernetes" | **IN SCOPE** | Intent is editorial content creation. |
| `001 Writing AI Agent` | "Deploy this Docker container to AWS" | **OUT OF SCOPE** | Requires DevOps infrastructure execution. |
| `066 Image Analysis AI Agent` | "Write a SQL migration" | **OUT OF SCOPE** | Requires database engineering. |
| `101 Super AI Agent` | "Build full-stack app with DB and tests" | **IN SCOPE** | Master orchestrator plans & coordinates specialists. |

---

## 3. Polite UX Invariants

- **Zero Harsh Wording**: Never uses `"rejected"`, `"wrong agent"`, `"error"`, `"cannot"`, or `"not my job"`.
- **Calm Visual Design**: Renders a calm liquid-glass card with violet/cyan accents, not red error styling.
- **Prompt Retention**: Switching agents keeps the original prompt in the composer without accidental automatic send.
- **Hardware Safe**: Scope classification runs deterministically in < 2ms without consuming GPU VRAM.
