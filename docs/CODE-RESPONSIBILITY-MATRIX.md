# Super AI — Code Responsibility Matrix

This document defines the strict architectural boundaries, data flow contracts, callers, and non-responsibilities for all primary modules across Super AI.

---

## 1. Intelligence & Orchestration Subsystems

### `platform/intelligence/task-planner.js`
- **Primary Responsibility**: Deconstructs arbitrary natural language goals into a structured, dependency-resolved Directed Acyclic Graph (DAG) of Task Steps.
- **NOT Responsible For**: Executing tools, running neural inference directly, managing file streams.
- **Callers**: `platform/intelligence/execution-engine.js`, `agents/agent-101-master-agent/backend/src/planner.js`.
- **Callees**: `platform/models/task-classifier.js`, `platform/models/model-router.js`, `registry/sih-agent-mapping.json`, `platform/tools/tool-registry.js`.
- **Inputs**: Natural language prompt (`goal`), context variables (`input`).
- **Outputs**: Canonical `TaskState` object with step array (`steps`), dependency map, and risk flags.
- **Public Interface**: `createPlan(goal, input)`, `chooseExecutionStrategy(goal, input)`, `validatePlan(plan)`.

### `platform/intelligence/replanner.js`
- **Primary Responsibility**: Detects missing parameters, conflicting NDT evidence, tool errors, or ungrounded claims during DAG execution, and synthesizes a revised DAG (bounded by `MAX_REPLANS = 3`).
- **NOT Responsible For**: Initial goal planning, modifying completed step outputs, calling external APIs.
- **Callers**: `platform/intelligence/execution-engine.js`.
- **Callees**: `platform/evidence/uncertainty-engine.js`, `platform/tools/tool-registry.js`.
- **Inputs**: Step execution result (`stepResult`), current `TaskState`, accumulated `evidenceList`.
- **Outputs**: Evaluated status (`NEED_REPLAN` / `RECOVERABLE` / `FATAL`) and patched `TaskState`.
- **Public Interface**: `evaluateStepResult(step, result, taskState)`, `generateReplan(taskState, failureReason)`, `detectMissingInformation(taskState)`, `detectEvidenceConflicts(evidenceList)`.

### `platform/intelligence/execution-engine.js`
- **Primary Responsibility**: Orchestrates step-by-step asynchronous DAG execution, dispatches tasks to selected local models, coordinates with 101 specialist agents, enforces HITL checkpoints, and produces deliverables.
- **NOT Responsible For**: Direct UI rendering, listening on HTTP ports.
- **Callers**: `platform/gateway/src/server.js` (`POST /api/chat`, `POST /api/investigations/start`).
- **Callees**: `platform/intelligence/task-planner.js`, `platform/intelligence/replanner.js`, `platform/intelligence/hitl-policy.js`, `platform/models/model-router.js`, `platform/tools/tool-registry.js`, `platform/deliverables/deliverable-engine.js`.
- **Inputs**: Task request, agent ID, model override, uploaded files.
- **Outputs**: Execution outcome containing synthesized text, structured evidence nodes, deliverable paths, and audit trace.
- **Public Interface**: `executeAutonomousTask(goal, options)`, `resumeTaskWithUserInput(taskId, input)`, `approveAndResumeTask(taskId, signOffPayload)`.

---

## 2. Models & Routing Subsystems

### `platform/models/model-router.js`
- **Primary Responsibility**: Resolves the optimal local model (`nemotron-3-nano`, `gemma3:4b`, `qwen2.5-coder:1.5b`) based on task capability classification and hardware constraints.
- **NOT Responsible For**: Generating prompt templates, storing document embeddings.
- **Callers**: `platform/intelligence/task-planner.js`, `platform/intelligence/execution-engine.js`, `platform/gateway/src/server.js`.
- **Callees**: `platform/models/model-registry.json`, `platform/models/hardware-profiler.js`.
- **Inputs**: Task type or capability requirement (`REASONING`, `VISION_OCR`, `CODE_GENERATION`).
- **Outputs**: Model profile object with local endpoint, context window, and quantization parameters.
- **Public Interface**: `routeModel(requirement)`, `getModelProfile(modelId)`, `listAvailableModels()`.

### `platform/models/task-classifier.js`
- **Primary Responsibility**: Fast deterministic heuristic classification of user intents into capability domains (e.g. Document Extraction, Risk Assessment, Code Refactoring).
- **NOT Responsible For**: LLM text generation, workflow execution.
- **Callers**: `platform/models/model-router.js`, `platform/intelligence/task-planner.js`.
- **Callees**: None.
- **Inputs**: Prompt string, attachment metadata.
- **Outputs**: Capability classification tag and confidence score.
- **Public Interface**: `classifyTask(prompt, attachments)`.

---

## 3. Knowledge, Multimodal & Evidence Subsystems

### `platform/knowledge/rag-engine.js`
- **Primary Responsibility**: Ingests, chunks, embeds, and retrieves industrial standard documents (OISD, API-653, ASME) using local vector search.
- **NOT Responsible For**: OCR image extraction (delegated to `multimodal/`), executing code.
- **Callers**: `platform/intelligence/execution-engine.js`, `platform/gateway/src/server.js` (`/api/knowledge/query`).
- **Callees**: `platform/knowledge/knowledge-store.js`.
- **Inputs**: Search query, optional metadata filter.
- **Outputs**: Top-k relevant text chunks with source page, standard clause, and similarity score.
- **Public Interface**: `queryKnowledgeBase(query, options)`, `ingestDocument(filePath, metadata)`.

### `platform/evidence/evidence-graph.js`
- **Primary Responsibility**: Maintains a directed graph of evidence nodes and causal/verification relationships (`SUPPORTS`, `CONTRADICTS`, `DERIVED_FROM`, `SUPERSEDES`).
- **NOT Responsible For**: Deciding plant shutdown actions (delegated to human engineers).
- **Callers**: `platform/intelligence/execution-engine.js`, `platform/investigation/investigation-engine.js`.
- **Callees**: None.
- **Inputs**: Evidence node data, relationship links.
- **Outputs**: Full evidence graph representation and exportable evidence packages.
- **Public Interface**: `addNode(node)`, `addRelationship(sourceId, targetId, type)`, `exportEvidencePackage(investigationId)`.

### `platform/evidence/uncertainty-engine.js`
- **Primary Responsibility**: Evaluates factuality and calculates calibrated confidence scores (`HIGH`, `MEDIUM`, `LOW`) and uncertainty states (`FACT`, `INFERENCE`, `MISSING`, `CONFLICT`, `UNCERTAIN`, `ESTIMATE`).
- **NOT Responsible For**: Guessing or hallucinating missing parameters.
- **Callers**: `platform/intelligence/replanner.js`, `platform/investigation/investigation-engine.js`.
- **Callees**: None.
- **Inputs**: Array of evidence statements and measurements.
- **Outputs**: Uncertainty classification, completeness percentage, conflict factors.
- **Public Interface**: `assessUncertainty(evidenceItems)`, `calculateConfidenceScore(corroborationMatrix)`.

### `platform/evidence/history-engine.js`
- **Primary Responsibility**: Performs historical trend analytics, multi-year thickness decay projections, and short-term vs long-term corrosion rate calculations.
- **NOT Responsible For**: Document rendering, network calls.
- **Callers**: `platform/intelligence/execution-engine.js`, `platform/investigation/investigation-engine.js`.
- **Callees**: None.
- **Inputs**: Equipment asset ID, time-series inspection records.
- **Outputs**: Calculated corrosion rate (`mm/year`), remaining wall thickness, estimated remaining life.
- **Public Interface**: `calculateCorrosionRates(assetId, historicalData)`, `recordMeasurement(assetId, measurement)`.

---

## 4. Governance, Security & Tools Subsystems

### `platform/security/egress-monitor.js`
- **Primary Responsibility**: Monitors, audits, and intercepts network sockets, asserting zero cloud data egress and absolute air-gap compliance.
- **NOT Responsible For**: Handling application auth tokens, password hashing.
- **Callers**: Platform gateway bootstrap, test runner lifecycle.
- **Callees**: None.
- **Inputs**: System socket requests, process network events.
- **Outputs**: Real-time egress violation alert count (strictly `0`).
- **Public Interface**: `startEgressMonitoring()`, `getEgressMetrics()`, `assertZeroEgress()`.

### `platform/tools/tool-registry.js`
- **Primary Responsibility**: Canonical repository of all industrial calculation tools, OCR wrappers, unit converters, and formula engines with explicit input/output validation schemas.
- **NOT Responsible For**: Direct execution of unvalidated code without sandbox.
- **Callers**: `platform/intelligence/task-planner.js`, `platform/intelligence/execution-engine.js`.
- **Callees**: Individual tool implementations.
- **Inputs**: Tool name, parameter payload, agent authorization token.
- **Outputs**: Deterministic JSON result or validation error.
- **Public Interface**: `getTool(name)`, `listTools()`, `executeTool(name, params, agentContext)`.

### `platform/deliverables/deliverable-engine.js`
- **Primary Responsibility**: Formats structured investigation findings into production-grade binary office deliverables (`.docx`, `.xlsx`, `.pptx`, `.pdf`).
- **NOT Responsible For**: Interpreting engineering safety norms (uses structured model findings).
- **Callers**: `platform/intelligence/execution-engine.js`.
- **Callees**: File writers, document template builders.
- **Inputs**: Investigation findings, NDT grid data, executive summary text.
- **Outputs**: Generated file paths on local filesystem (`E:\Smart Automation\100-AI-Agents\artifacts\`).
- **Public Interface**: `generateDocumentPackage(investigationData)`.
