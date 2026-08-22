# Super AI — Master Codebase Architecture Map

## 1. Executive System Overview

**Super AI** (Sovereign AI Workbench) is a 100% on-premise, air-gapped industrial AI platform orchestrating a fleet of **101 autonomous agents** (`101` Super AI Master Orchestrator + `001..100` Domain Specialists) across 3 local models (Google Gemma 3, NVIDIA Nemotron 3, Qwen 2.5 Coder) with zero cloud dependencies and zero data egress.

```
SUPER AI
│
├── 1. Presentation Layer (UI Shell)
│   └── platform/web/ (HTML5, CSS3 Cosmic Liquid Glass, Vanilla JS controller)
│
├── 2. API & Gateway Layer
│   └── platform/gateway/ (HTTP/SSE Gateway, WebSocket stream, Workforce routes)
│
├── 3. Intelligence & Orchestration Layer
│   ├── Task Classifier (platform/models/task-classifier.js)
│   ├── Model Router (platform/models/model-router.js)
│   ├── Task Planner (platform/intelligence/task-planner.js)
│   ├── Replanner (platform/intelligence/replanner.js)
│   ├── Execution Engine (platform/intelligence/execution-engine.js)
│   └── Human-In-The-Loop Policy (platform/intelligence/hitl-policy.js)
│
├── 4. Agent Workforce Layer
│   ├── Agent 101 Master Agent (agents/agent-101-master-agent/)
│   ├── 100 Specialist Agents (agents/agent-001..100/)
│   ├── Canonical Mapping (registry/sih-agent-mapping.json)
│   └── Agent Contract (agent-contract/)
│
├── 5. Knowledge, Multimodal & Evidence Layer
│   ├── RAG Engine & Local Vector Store (platform/knowledge/)
│   ├── Multimodal OCR & Drawing Pipeline (platform/multimodal/)
│   ├── Evidence Graph & Provenance (platform/evidence/evidence-graph.js)
│   ├── Uncertainty Engine & Calibrated Confidence (platform/evidence/uncertainty-engine.js)
│   └── Historical Intelligence & Trend Analysis (platform/evidence/history-engine.js)
│
├── 6. Tools, Sandboxing & Deliverables Layer
│   ├── Canonical Tool Registry (platform/tools/tool-registry.js)
│   ├── Code Sandbox (platform/sandbox/code-sandbox.js)
│   └── Deliverable Engine (platform/deliverables/deliverable-engine.js)
│
├── 7. Security, Governance & Audit Layer
│   ├── Egress Monitor & Air-Gap Enforcement (platform/security/egress-monitor.js)
│   ├── Sovereignty Center & Status (platform/security/sovereignty-center.js)
│   └── Tamper-Evident Audit Service (platform/services/audit-service.js)
│
├── Automation & Workspaces
│   ├── Local Event Bus & Scheduler (platform/automation/)
│   ├── Role-Based Workspaces (platform/workspaces/)
│   └── Workflow Engine & Definitions (platform/workflow-engine/)
│
├── Test Infrastructure
│   ├── SIH Platform Test Matrix (tests/sih/)
│   ├── Workforce Fleet Suite (tests/run-all-agents.js)
│   ├── UI & Composer Regression (tests/ui/, tests/sih/ui/)
│   └── Empirical Model Benchmarks (tests/benchmark/)
│
└── Scripts & Tooling
    ├── Development & Run Scripts (scripts/)
    └── SIH Rehearsal & Setup (scripts/sih/)
```

---

## 2. The Seven Architectural Layers

| Layer | Directory | Primary Role | Invariants |
|---|---|---|---|
| **Layer 1: Presentation** | `platform/web/` | Responsive Cosmic Liquid Glass UI, chat composer, model selector, inspector | No business logic bypass; communicates strictly via Gateway API |
| **Layer 2: Gateway** | `platform/gateway/` | Unified API entrypoint, stream serialization, routing to intelligence engine | Single entrypoint port `8300`, CORS/Security headers |
| **Layer 3: Intelligence** | `platform/intelligence/`, `platform/models/` | Task classification, dynamic DAG planning, self-healing replanning, execution orchestration | Max 3 replans; grounded evidence only |
| **Layer 4: Agent Workforce** | `agents/`, `registry/` | 101 industrial domain agents (Engineering, Safety, Operations, Compliance, Procurement) | Single source of truth in `registry/sih-agent-mapping.json` |
| **Layer 5: Knowledge & Evidence** | `platform/knowledge/`, `platform/multimodal/`, `platform/evidence/` | Local document OCR, vector retrieval, evidence relationship graph, trend calculations | 100% local processing; zero external API calls |
| **Layer 6: Tools & Deliverables** | `platform/tools/`, `platform/sandbox/`, `platform/deliverables/` | Deterministic tool execution, isolated sandbox, official `.docx`, `.xlsx`, `.pptx` generation | Strict input/output schemas; permission gates |
| **Layer 7: Governance & Audit** | `platform/security/`, `platform/services/` | Egress blocking, HITL sign-offs, role-based access, cryptographic audit log | Total air-gap enforcement; zero cloud egress |

---

## 3. Canonical Sources of Truth

1. **Agent Registry**: `registry/sih-agent-mapping.json`
   - Defines all 101 agents, their IDs (`101` Super AI, `001..100` Specialists), industrial roles, domains, capabilities, and tool permissions.
2. **Model Registry**: `platform/models/model-registry.json`
   - Defines the 3 production models: Google Gemma 3 (`gemma3:4b`), NVIDIA Nemotron 3 (`nemotron-3-nano`), Qwen 2.5 Coder (`qwen2.5-coder:1.5b`), their Ollama tags, VRAM requirements, and capability mappings.
3. **Tool Registry**: `platform/tools/tool-registry.js`
   - Defines all available deterministic tools, input/output schemas, permission requirements, and risk levels.
4. **Workflow Definitions**: `platform/workflow-engine/definitions/`
   - Standard reusable industrial workflows (e.g. `inspection-report-analysis.js`).

---

## 4. Key Entrypoints

| Subsystem | Canonical Entrypoint | Command |
|---|---|---|
| **Gateway & Web Server** | `platform/gateway/src/server.js` | `node platform/gateway/src/server.js` |
| **Complete Fleet Runner** | `scripts/run-fleet.js` | `node scripts/run-fleet.js` |
| **Workforce Test (101 Agents)** | `tests/run-all-agents.js` | `node tests/run-all-agents.js --concurrency=10` |
| **Platform SIH Test Matrix** | `tests/sih/run-all-tests.js` | `node tests/sih/run-all-tests.js` |
| **Local Model Benchmark** | `scripts/benchmark/run-model-benchmark.js` | `node scripts/benchmark/run-model-benchmark.js` |
| **Supervisor Daemon** | `scripts/supervisor.js` | `node scripts/supervisor.js` |
| **Windows Auto-Start** | `scripts/register-windows-autostart.ps1` | `powershell -File scripts/register-windows-autostart.ps1` |
