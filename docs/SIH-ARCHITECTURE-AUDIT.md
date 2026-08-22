# SIH MRPL SOVEREIGN AI WORKBENCH — ARCHITECTURAL AUDIT

**Project:** Sovereign AI Workbench  
**Client / Problem Statement:** Mangalore Refinery and Petrochemicals Limited (MRPL) — *Sovereign On-Premise Agentic AI Workbench using Open-Weight Multimodal LLMs for Confidential Industrial Work*  
**Repository:** `E:\Smart Automation\100-AI-Agents`  
**Current Baseline Branch:** `baseline/pre-sih-mrpl-transform`  
**Active Development Branch:** `feature/sih-mrpl-sovereign-workbench`  
**Lead Architect:** Principal Engineer / Technical Lead  
**Date:** August 22, 2026  

---

## 1. TASK & OBJECTIVE

Audit the existing 100-agent educational platform codebase (`SA-S03 / EduPilot AI`) to determine:
1. **Reusable Platform Infrastructure:** Core execution engines, registries, supervisor, gateway, tool executor, epistemic reasoner, DAG coordinator, and audit logging.
2. **Obsolete Educational Components:** Student records, admission workflows, scholarship eligibility engines, academic grading logic, and educational terminology.
3. **Target Industrial Architecture:** Local multi-model router, air-gapped sovereign execution layer, multimodal document/drawing/photo processing pipeline, local RAG with SOP citations, sandboxed code execution, real deliverable generation (DOCX, XLSX, PPTX), human-in-the-loop governance, and visible zero-data-exfiltration network telemetry.

---

## 2. CODEBASE INVENTORY & FILE INSPECTION

### 2.1 Fleet & Control Plane
- `registry/agents.json` (91.9 KB): Registry of 100 specialized agents + Agent 101 with port allocations (8101–8201), capability tags, and metadata.
- `agents/agent-001` through `agents/agent-100`: 100 independent agent servers with standard contracts (`/api/health`, `/api/agent`).
- `agent-template/`: Canonical scaffold for agent creation.
- `agent-contract/`: JSON Schemas for requests, responses, and health checks.
- `control-plane/`: Lightweight service discovery router.

### 2.2 Platform Intelligence & Core Engines (`platform/`)
- `platform/gateway/src/server.js`: Unified API Gateway hosting `/api/chat`, `/api/workforce`, `/api/workflows`, and static web distribution.
- `platform/intelligence/`:
  - `intent-engine.js`: Goal, action, entity, risk, and cross-domain classification.
  - `router.js`: Multi-factor agent scoring and dynamic DAG decomposition.
  - `tool-caller.js`: Structured tool executor enforcing RBAC allowlists.
  - `reasoner.js`: Epistemic reasoning engine separating `FACT`, `INFERENCE`, and `UNKNOWN`.
  - `coordinator.js`: Multi-agent DAG execution and conflict detection.
  - `hitl-policy.js`: Risk level classifier and Human-In-The-Loop approval gater.
  - `context-manager.js`: Execution context and cryptographic trace generator (`INT-YYYY-XXXXXX`).
  - `prompt-builder.js`: Modular structured prompt constructor.
- `platform/workflow-engine/`: Deterministic state machine engine supporting step transitions, pending human decisions, and audit trail ledgering.
- `platform/tools/tool-registry.js`: Central RBAC-controlled tool executor.
- `platform/services/`: Institutional backend services (to be adapted into industrial services: Document, Inspection, Engineering, Safety, Inventory, and Audit).

### 2.3 Web Dashboard & Supervisor
- `platform/web/`:
  - `index.html`: Main Single Page Application interface.
  - `ui-polish.css`: Dark-mode visual presentation system.
  - `ui-polish.js`: Interactive client controller for chat, fleet browser, workflows, and approvals.
- `scripts/supervisor.js`: Auto-recovery supervisor managing Ollama, Fleet, Gateway, and Edge Tunnels.
- `scripts/run-fleet.js`: High-performance concurrent multi-agent runner.

---

## 3. REUSABLE INFRASTRUCTURE VS OBSOLETE COMPONENTS

| Component Layer | Existing SA-S03 Implementation | Reusability Status | Transformation Strategy for Sovereign Workbench |
| :--- | :--- | :---: | :--- |
| **Agent Server Fleet** | 100 micro-servers + contracts | **100% REUSABLE** | Repurpose all 100 agents from educational roles to 20 industrial capability domains. |
| **Agent 101** | Educational Master Agent | **100% REUSABLE** | Repurpose into **Sovereign Orchestrator** (Task Planner + DAG Builder). |
| **Tool Registry & RBAC** | Educational tool permissions | **100% REUSABLE** | Expand tools for local files, OCR, vision, RAG, sandbox, spreadsheets, DOCX/PPTX. |
| **Epistemic Reasoner** | FACT / INFERENCE / UNKNOWN | **100% REUSABLE** | Enforce zero-hallucination policy for technical specs and inspection findings. |
| **DAG Coordinator** | Multi-agent execution graph | **100% REUSABLE** | Coordinate multi-step industrial pipelines (OCR -> Vision -> RAG -> Risk -> DOCX). |
| **HITL Approval Engine** | Academic committee approval | **100% REUSABLE** | Enforce safety sign-offs for high-risk engineering & operational actions. |
| **Supervisor & Fleet Runner** | Process auto-recovery | **100% REUSABLE** | Monitor Ollama, local models, sandbox, and local network egress. |
| **Student / Course Services** | Student attendance/marks DB | **OBSOLETE** | Replace with **Industrial Plant & Asset Services** (Equipment, Inspection, SOPs). |
| **Scholarship Workflows** | Financial aid / admission DAGs | **OBSOLETE** | Replace with **Flagship Industrial Workflows** (Inspection, Drawing Review, Safety). |
| **Educational Web UI** | College ERP styling & terms | **OBSOLETE** | Redesign as **Sovereign AI Workbench** (Deep dark, liquid glass, technical telemetry). |

---

## 4. RISKY SHARED FILES & MITIGATION PLAN

1. **`platform/gateway/src/server.js`**: Core HTTP entry point.
   - *Risk:* Breaking existing `/api/chat` or `/api/workforce` endpoints.
   - *Mitigation:* Add backward-compatible `/api/sovereign/*`, `/api/models/*`, and `/api/deliverables/*` routes cleanly.
2. **`platform/tools/tool-registry.js`**: Tool execution gateway.
   - *Risk:* Breaking existing RBAC permissions.
   - *Mitigation:* Refactor into modular tool handlers with strict sandbox validation.
3. **`platform/web/index.html` & `ui-polish.js`**: Frontend interface.
   - *Risk:* Visual regression or broken event listeners.
   - *Mitigation:* Cleanly restructure UI into Sovereign Workbench sections (Workbench Home, Model Router, Documents, Knowledge Base, Agent Workforce, Deliverables, Approvals, Sovereignty Center).

---

## 5. INTEGRATION ARCHITECTURE TARGET

```
                          SOVEREIGN AI WORKBENCH
                                    │
                         [ SOVEREIGN POLICY GATE ]
                          (Zero Data Exfiltration)
                                    │
                       [ LOCAL TASK ANALYZER ]
                                    │
                       [ LOCAL MODEL ROUTER ]
          ┌─────────────────────────┼────────────────────────┐
          ▼                         ▼                        ▼
  REASONING MODEL              VISION MODEL              CODE MODEL
 (Nemotron 3 Nano)       (Local Multimodal/OCR)    (Local Code Specialist)
          │                         │                        │
          └─────────────────────────┼────────────────────────┘
                                    ▼
                        [ SOVEREIGN ORCHESTRATOR ]
                               (Agent 101)
                                    │
                     [ 100 SPECIALIZED AGENTS ]
             (Document, Engineering, Inspection, Safety, etc.)
                                    │
                        [ LOCAL TOOLBOX & RBAC ]
          ┌─────────────────────────┼────────────────────────┐
          ▼                         ▼                        ▼
 MULTIMODAL PIPELINE           CODE SANDBOX             LOCAL VECTOR RAG
 (PDF, OCR, P&ID, Photo)     (Isolated Execution)     (SOPs, Manuals, Specs)
          │                         │                        │
          └─────────────────────────┼────────────────────────┘
                                    ▼
                        [ EVIDENCE REASONER ]
                   (FACT vs INFERENCE vs UNKNOWN)
                                    │
                        [ HITL APPROVAL GATE ]
                    (Engineer / Manager Sign-off)
                                    │
                        [ DELIVERABLES ENGINE ]
                   (DOCX, XLSX, PPTX, PDF, Code ZIP)
                                    │
                        [ AUDIT & SOVEREIGNTY ]
                       (INT-Trace & Egress = 0)
```

---

## 6. RECOMMENDATIONS FOR IMMEDIATE EXECUTION

1. **Phase B (Core Infrastructure):** Implement Model Router (`platform/models/`), Sovereign Security Policy (`platform/security/`), Multimodal Pipeline (`platform/multimodal/`), Local Knowledge RAG (`platform/knowledge/`), Code Sandbox (`platform/sandbox/`), and Deliverables Engine (`platform/deliverables/`).
2. **Phase C (Product Features):** Implement 100 Industrial Agent Taxonomy (`registry/sih-agent-mapping.json`), Industrial Workflows (`platform/workflow-engine/definitions/`), Sovereign Orchestrator (Agent 101), and Sovereign Workbench Web UI.
3. **Phase D (Testing & Validation):** Execute 101/101 fleet tests, RAG tests, sandbox tests, deliverable tests, sovereignty zero-egress tests, and flagship end-to-end industrial inspection demo.
