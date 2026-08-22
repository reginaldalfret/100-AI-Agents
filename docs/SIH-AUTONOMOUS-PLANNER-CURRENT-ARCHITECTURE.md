# SIH Sovereign Autonomous Planner & Orchestrator: Current vs Target Architecture

**Status:** Authoritative Architectural Specification  
**Scope:** Agent 101 Master Agent, Platform Intelligence Engine, Workflow Engine, Tool Registry, Model Router, and Task Classifier  
**Environment:** 100% Air-Gapped / On-Premise Sovereign AI Workbench  

---

## 1. Executive Summary

The Sovereign Autonomous Planning and Orchestration subsystem coordinates 100 specialist agents and 30+ sovereign tools across air-gapped local open-weight models (NVIDIA Nemotron 3 Nano 4B, Gemma 3 4B Vision/OCR, Qwen2.5-Coder 1.5B/3B).

This document captures:
1. **Current Implementation Inspection**: Deep-dive analysis of existing code in `agents/agent-101-master-agent/` and `platform/`.
2. **Current vs Target Architectural Comparison**: Detailed capability matrices, execution models, and data flow topologies.
3. **Gap Analysis**: Specific architectural bottlenecks in planning, delegation, routing, and tool dispatch.
4. **Unified Target Architecture**: The converged DAG-based autonomous execution pipeline with multi-model dispatch, dynamic replanning, RBAC tool gating, evidence conflict detection, and Human-in-the-Loop (HITL) governance.

---

## 2. Component Inspection & Current Implementation Analysis

### 2.1 Agent 101 Planner (`agents/agent-101-master-agent/backend/src/planner.js`)
* **Core Function:** `createPlan(task)`
* **Mechanism:**
  - Ingests task string and loads specialist agents via `getSpecialists()` from `registry.js` (filters `agents.json`).
  - Serializes specialist list into a flat catalog: `- agent_id: name [category] (capabilities)`.
  - Invokes `generateWithOllama` with temperature `0.1` and system prompt instructing JSON generation (`complexity`, `reasoning`, `subtasks: [{ agent_id, task }]`).
  - Extracts and parses JSON using regex and brace matching fallbacks (`extractJson`).
  - Validates `subtasks` against known agent IDs and filters invalid IDs.
* **Current Characteristics:**
  - **Flat Execution Plan:** Subtasks are returned as a flat list without sequential dependencies (no DAG structure).
  - **Catalog Token Footprint:** Passes all specialist descriptions to Ollama on each plan generation.
  - **Coupling:** Emits agent IDs only; does not plan tool invocations or model allocations directly.

### 2.2 Agent 101 Delegator (`agents/agent-101-master-agent/backend/src/delegator.js`)
* **Core Functions:** `delegate(agentId, task, context)`, `delegateMany(subtasks, context)`
* **Mechanism:**
  - Dispatches tasks via HTTP POST to `http://localhost:${agent.port}/api/agent` (timeout: 120s).
  - **In-Process Fallback:** If HTTP request fails/times out, dynamically imports `agents/${agentFolder}/backend/src/agent.js` and invokes `runAgent(payload)` in-process.
  - `delegateMany`: Concurrently dispatches all subtasks in parallel via `Promise.all`.
* **Current Characteristics:**
  - **Parallel-Only Execution:** Scatter-gather execution model without sequential data-piping between steps.
  - **Independent Context:** Context is broadcast to all subtasks identically rather than accumulating intermediate step outputs.
  - **Static Failure Recovery:** Captures failures in metadata but does not trigger dynamic replanning.

### 2.3 Workflow Engine (`platform/workflow-engine/engine.js` & `definitions/`)
* **Core Functions:** `startWorkflow(workflowId, input)`, `executeNextStep(instance, definition)`, `submitHumanDecision(instanceId, decisionPayload)`
* **Mechanism:**
  - Manages predefined deterministic workflows (e.g., `inspection-report-analysis`, `pid-drawing-review`, `safety-compliance-audit`, `vendor-cost-comparison`).
  - Sequential step execution with step outputs accumulated into `instance.context.stepOutputs` and `instance.evidenceLedger`.
  - **HITL Gate Interception:** When `step.is_hitl` is true, sets status to `pending_approval` and pauses until `submitHumanDecision()` is called.
  - **Audit Integration:** Emits structured events to `AuditService.logAudit` at each state transition.
* **Current Characteristics:**
  - Highly robust for static, linear industrial SOP workflows.
  - Separate from the ad-hoc LLM planning flow in Agent 101.

### 2.4 Tool Registry & RBAC Permissions (`platform/tools/tool-registry.js`)
* **Core Functions:** `TOOL_DEFINITIONS`, `isToolAllowed(agentId, toolName)`, `executeTool(agentId, toolName, params, workflowId)`
* **Mechanism:**
  - Centralizes 30+ tools across domains:
    - **Multimodal & Vision:** `ocr_document`, `extract_pdf`, `analyze_image`.
    - **Knowledge & RAG:** `search_knowledge` (refinery SOPs/OISD standards).
    - **Engineering & Calculation:** `calculate_step_by_step` (API-653 corrosion rate/remaining life), `get_asset_history`, `assess_risk`.
    - **Code & Sandbox:** `execute_python_sandbox` (isolated local execution).
    - **Spreadsheets & Deliverables:** `read_excel`, `write_excel`, `generate_docx`, `generate_xlsx`, `generate_pptx`.
    - **Workflow & Audit:** `create_task`, `update_task`, `record_agent_action`, `record_decision`, `create_approval`.
  - **RBAC Policy:** Validates `agentId` against `sih-agent-mapping.json` allowlists; `agent-101` and `master` possess full wildcard (`*`) access.
  - **Audit Logging:** Every tool call and error is logged to `AuditService`.

### 2.5 Model Router (`platform/models/model-router.js`)
* **Core Function:** `routeTaskToLocalModel(taskInput)`
* **Mechanism:**
  1. Classifies task using `classifyTask()` from `task-classifier.js`.
  2. Resolves model configuration from `model-registry.js` (`nemotron-3-nano`, `local-vision-ocr`, `local-code-specialist`).
  3. Validates strict local egress sovereignty via `evaluateSovereignEgress()` (zero cloud leak, loopback only).
  4. Manages hardware slots and VRAM/RAM constraints via `modelLifecycle.acquireModelSlot()`.
  5. Records telemetry via `egressMonitor.recordLocalInference()`.

### 2.6 Task Classifier (`platform/models/task-classifier.js`)
* **Core Function:** `classifyTask(input, attachments)`
* **Mechanism:**
  - Evaluates file extensions and semantic trigger keywords:
    - **`CODING_SANDBOX`:** Triggered by `.py`, `.csv`, `.xlsx`, `.sql`, scripting/formula keywords -> Routes to `local-code-specialist` (Qwen2.5-Coder).
    - **`VISION_MULTIMODAL`:** Triggered by `.png`, `.jpg`, `.dwg`, `.pdf` scans, P&ID/defect keywords -> Routes to `local-vision-ocr` (Gemma 3 4B / ONNX).
    - **`REASONING`:** Default for SOP synthesis, decision making, orchestration -> Routes to `nemotron-3-nano` (4B Q4_K_M).
  - Returns modality, preferred model, recommended specialist agent IDs, and confidence score.

---

## 3. Current vs Target Architecture Comparison

| Architectural Dimension | Current Architecture | Target Converged Architecture |
| :--- | :--- | :--- |
| **Plan Structure** | Flat list of subtasks (`planner.js`) or rigid static workflows (`engine.js`). | Directed Acyclic Graph (DAG) with explicit dependencies, tool allocations, and validation gates. |
| **Execution Strategy** | Scatter-gather parallel execution (`Promise.all` in `delegator.js`). | Dynamic DAG execution engine (`execution-engine.js`) supporting parallel, sequential, and branched steps with state pipelining. |
| **Model Routing** | Direct call to Nemotron-3-Nano for all Agent 101 tasks. | Automated multi-model routing (`model-router.js`) dynamically dispatching each DAG node to Nemotron, Gemma 3 OCR, or Qwen-Coder based on hardware profile and task modality. |
| **Failure Recovery** | Records subtask status as `"failed"` and continues to synthesis. | Autonomous Replanner (`replanner.js`) triggering fallback agents, missing data retrieval steps, or alternate model routes upon step failure. |
| **Tool Calling** | Imperative tool execution in workflow steps; agents invoke tools independently. | Gated, auditable Tool Caller with RBAC authorization, sandbox isolation, and automatic evidence capture into the execution ledger. |
| **Evidence & Conflict Handling** | Best-effort text synthesis via LLM prompt (`synthesizer.js`). | Multi-source Evidence Ledger (`coordinator.js`) with discrepancy detection (e.g. conflicting thickness values) triggering automated HITL escalation. |
| **Human-in-the-Loop (HITL)** | Static `is_hitl` flag on predefined workflow steps. | Dynamic HITL policy based on risk scoring, statutory compliance violations, evidence discrepancies, and financial/safety thresholds. |
| **Data Sovereignty & Egress** | Offline default. | Air-gapped Sovereign Policy verification at model router, tool execution, and deliverable export layers with cryptographic audit trail. |

---

## 4. Detailed Component Data Flow

```
User ([User Goal / Industrial Directive])
       │
       ▼
InputGate [Intent Engine & Task Classifier]
       │
  ┌────┴───────────────────────────────┐
  ▼                                    ▼
StrategyCheck {Execution Strategy}    ModelRouter [Model Router & Hardware Profiler]
  ├─► PredefinedWF [Predefined SOP]      ├─► Vision / OCR: Gemma 3 / Local Vision Engine
  └─► AutonomousPlanner [Dynamic DAG]    ├─► Code / Sandbox: Qwen2.5-Coder
                                         └─► Reasoning: NVIDIA Nemotron 3 Nano
       │
       ▼
ExecutionEngine [Autonomous Execution Engine]
       │
       ├─► StepRunner [Step Dispatcher]
       │     ├─► Tool Registry & RBAC Controller
       │     └─► 100 Specialist Agents Pool
       │
       ├─► State Accumulator [Task State & Evidence Ledger]
       │     └─► Conflict / Missing Data Detector
       │           ├─► Replanner [Autonomous Replanner]
       │           └─► HITL Gate [Human Review / Sign-off]
       │
       ▼
Synthesizer [Epistemic Synthesizer & Deliverable Engine]
       ├─► Immutable Audit Ledger
       └─► Final Deliverables (.docx, .xlsx, .pptx)
```
