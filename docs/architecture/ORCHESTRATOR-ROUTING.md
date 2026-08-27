# Sovereign AI Workbench — Orchestrator Routing Architecture

**Document Version**: 2.0.0  
**Platform**: Sovereign AI Workbench — Industrial On-Premise AI Platform  
**Target Hardware Profile**:
- **CPU**: Intel Core i5-11400H (6 Cores / 12 Threads @ 2.70 GHz base, 4.50 GHz boost)
- **GPU**: NVIDIA GeForce RTX 2050 Mobile (4 GB GDDR6 VRAM, 2048 CUDA Cores)
- **System Memory**: 16 GB DDR4 RAM (Air-gapped)
- **Host OS**: Windows 11 Enterprise (x64)
- **Air-Gap Security Guarantee**: 100% Local Execution · Zero Cloud Egress · Strict Egress Blackhole

---

## 1. Executive Summary & Routing Philosophy

The **Sovereign AI Workbench** executes a multi-tiered, autonomous routing architecture designed to resolve user requests into optimal, deterministic execution graphs under strict 4GB VRAM and air-gapped security constraints.

Routing is not a single decision point; it is a synchronized **3-Stage Dispatch Pipeline**:

```
                                  USER INPUT PROMPT + ATTACHMENTS
                                                 |
                                                 v
+---------------------------------------------------------------------------------------------------+
| 1. INTENT CLASSIFICATION & TASK DECOMPOSITION                                                     |
|    - Modality (Text, Code, Vision, OCR)                                                           |
|    - Technical Domain (AST, Database, STEM, Security, Release, etc.)                             |
|    - Risk Level (Low, Medium, High, Critical)                                                     |
+---------------------------------------------------------------------------------------------------+
                                                 |
         +---------------------------------------+---------------------------------------+
         |                                       |                                       |
         v                                       v                                       v
+------------------+                    +------------------+                    +------------------+
| 2. AGENT ROUTER  |                    | 3. MODEL ROUTER  |                    | 4. TOOL ROUTER   |
|                  |                    |                  |                    |                  |
| - External Agent |                    | - GPU Tier (8)   |                    | - DOCUMENT Tools |
|   Integrations   |                    | - CPU Tier (4)   |                    | - COMPUTE Tools  |
| - Built-in       |                    | - VRAM Mutex     |                    | - STORAGE Tools  |
|   Specialists    |                    | - Dynamic Assign |                    | - DATA Tools     |
|   (001 - 300)    |                    |   (No Hardcodes) |                    | - DELIVERABLE    |
| - Master 101/301 |                    |                  |                    | - RBAC Guard     |
+------------------+                    +------------------+                    +------------------+
         |                                       |                                       |
         +---------------------------------------+---------------------------------------+
                                                 |
                                                 v
+---------------------------------------------------------------------------------------------------+
| 5. "WHY THIS ROUTE?" TRACE GENERATION & DAG EXECUTION ENGINE                                      |
|    - Bounded Replanning (Max 3 Loops) · Uncertainty Scoring · Tamper-Evident Audit Trail          |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Model Router Deep Dive

The **Model Router** (`platform/models/model-router.js`) resolves classified tasks and agent requests to the optimal local open-weight model. Agents never hardcode model bindings; all inference targets are dynamically negotiated based on hardware capacity, token budget, and domain mastery.

```
                              INCOMING INFERENCE REQUEST
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| EVALUATE EGRESS & SOVEREIGNTY (evaluateSovereignEgress)                           |
| Must resolve strictly to local endpoints: 127.0.0.1:11434 / 127.0.0.1:8305       |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| TASK INTENT & DOMAIN CLASSIFIER (classifyTask)                                    |
| Maps intent keywords & modalities to primary model capabilities                   |
+-----------------------------------------------------------------------------------+
                                          |
        +---------------------------------+---------------------------------+
        |                                                                   |
        v                                                                   v
 [ GPU Model Selection ]                                             [ CPU Model Selection ]
 (VRAM Available: <= 4096 MB)                                        (Lock-Free Parallel / CPU Fallback)
 +-----------------------------------+                               +-----------------------------------+
 | CODE -> Qwen 2.5 Coder 1.5B       |                               | EXTRACTION -> Liquid AI LFM2.5    |
 | STEM/MATH -> Phi-4 Mini 3.8B      |                               | TEXT/REWRITE -> RWKV-7 0.4B       |
 | RAG/TOOLS -> IBM Granite 4 1B-H   |                               | CHAT/FALLBACK -> TinyLlama 1.1B   |
 | REASONING -> Nemotron 3 Nano      |                               | MULTILINGUAL -> Stable LM 2 1.6B  |
 | CHAT/QA -> Meta Llama 3.2 1B      |                               | OCR/VISION -> PaddleOCR (ONNX)    |
 | EDGE NLP -> Google Gemma 3 1B     |                               +-----------------+-----------------+
 | TRANSFORM -> SmolLM2 1.7B         |                                                 |
 | SCIENCE -> Falcon3 1B             |                                                 v
 +-----------------+-----------------+                                        Intel Core i5-11400H
                   |                                                          (num_gpu: 0 · 100% CPU)
                   v
      RTX 2050 Mutex Lock
      (MAX_GPU_CONCURRENCY = 1)
```

### 2.1 GPU Model Selection Heuristics

All GPU models execute via Ollama with CUDA acceleration on the NVIDIA GeForce RTX 2050 (4GB VRAM). The selection rules prioritize model architecture specializations:

| Domain / Intent | Target Model | Ollama Tag | VRAM | Selection Heuristic & Rationale |
|---|---|---|---|---|
| **Code Synthesis / AST / Shell** | **Qwen 2.5 Coder 1.5B** | `qwen2.5-coder:1.5b` | 1,200 MB | Best-in-class multi-language AST comprehension, code generation, refactoring, and deterministic regex/bash scripting. |
| **STEM / Math / Logic Proofs** | **Microsoft Phi-4 Mini** | `phi4-mini` | 2,400 MB | Exceptional formal logic, multi-step algebraic deduction, physical formulas, and algorithmic puzzle solving. |
| **Enterprise RAG / Tool Use** | **IBM Granite 4 1B-H** | `granite4:1b-h` | 1,200 MB | Specially tuned for structured JSON function calling, schema transformations, and citation-grounded RAG extraction. |
| **Super AI Orchestration** | **NVIDIA Nemotron 3 Nano** | `nemotron-3-nano:latest` | 2,840 MB | Master coordinator model; excels at complex task decomposition, multi-agent debate synthesis, and statutory audits. |
| **General Conversation / Fast QA**| **Meta Llama 3.2 1B** | `llama3.2:1b` | 1,300 MB | Sub-25ms time-to-first-token, excellent conversational fluency, creative text generation, and lightweight summarization. |
| **Dense Edge NLP / Extraction** | **Google Gemma 3 1B** | `gemma3:1b` | 1,100 MB | High parameter efficiency for concise technical Q&A, evidence-grounded summarization, and lightweight layout parsing. |
| **High-Throughput Transformation**| **SmolLM2 1.7B** | `smollm2:1.7b` | 1,800 MB | 8-bit quantized compact engine delivering >60 tokens/sec for rapid rewriting, syntax normalization, and data formatting. |
| **Science & Technical Coding** | **Falcon3 1B** | `falcon3:1b-instruct-q4_K_M` | 1,300 MB | Specialized TII architecture optimized for scientific domain inquiries, physics computations, and technical analysis. |

### 2.2 CPU Model Fallback Architecture

CPU models run with `num_gpu: 0` on the Intel Core i5-11400H CPU. They operate lock-free and serve as automatic fallbacks when:
1. The **GPU Mutex is locked** by an ongoing deep reasoning or code synthesis task.
2. The task requires **zero VRAM overhead** (e.g. background data ingestion).
3. The workload consists of **pure structured data transformation or extraction**.

| Fallback Trigger / Task Type | Target CPU Model | Checkpoint Tag | RAM Footprint | Fallback Rationale |
|---|---|---|---|---|
| **Data Extraction & Tool Routing** | **Liquid AI LFM2.5 350M** | `LiquidAI/lfm2.5-350m` | 466 MB | Non-transformer Liquid Neural Network; ultra-low CPU footprint with 128k context for JSON extraction. |
| **Text Generation & Rewriting** | **RWKV-7 0.4B** | `mollysama/rwkv-7-g1d:0.4b` | 547 MB | Recurrent architecture with 1M context; zero KV-cache memory growth during long generation passes. |
| **Conversational Fallback** | **TinyLlama 1.1B** | `tinyllama:1.1b-chat` | 637 MB | Standard transformer chat model; reliable general assistance when GPU is completely saturated. |
| **Multilingual Text & Reports** | **Stable LM 2 1.6B** | `stablelm2:1.6b` | 982 MB | Multi-language text synthesis running efficiently across 12 CPU threads without GPU contention. |
| **Document OCR & Layout Parsing** | **PaddleOCR 3.7.0** | `paddleocr-engine` | 1,024 MB | ONNX runtime inference across CPU threads for high-resolution scanned PDF and image OCR. |

### 2.3 Agent-to-Model Decoupling (`routeAgentToModel`)

External agents and built-in specialist agents do not bind directly to model names. Instead, they request capabilities:

```javascript
// Agent requests inference with requirements
const routingResult = routeAgentToModel('hermes', 'CODE_GENERATION', {
  requiresGpu: true,
  maxVramMb: 2000
});

// Router dynamically resolves:
// routingResult = {
//   model_id: 'qwen2.5-coder:1.5b',
//   model_name: 'Qwen 2.5 Coder 1.5B (Local)',
//   execution_target: 'GPU',
//   vram_mb: 1200,
//   reason: 'Matched code generation capability within 2000MB VRAM budget'
// }
```

---

## 3. Tool Router Deep Dive

The **Tool Router** (`platform/tools/tool-router.js`) inspects task specifications and agent permissions to dynamically select and wrap tool invocations.

```
                             TASK EXECUTION CONTEXT
                                       |
                                       v
+-------------------------------------------------------------------------------+
| KEYWORD & SEMANTIC MATCHER (getToolsForTask)                                  |
| Extracts tool candidates from prompt text and attachment metadata             |
+-------------------------------------------------------------------------------+
                                       |
                                       v
+-------------------------------------------------------------------------------+
| RBAC PERMISSIONS CONTROLLER (executeToolForAgent)                             |
| Validates isToolAllowed(tool) && checkAgentPermission(agentId, tool)          |
+-------------------------------------------------------------------------------+
                                       |
       +-------------------------------+-------------------------------+
       |                               |                               |
       v                               v                               v
[ DOCUMENT TOOLS ]             [ COMPUTE TOOLS ]              [ DELIVERABLE TOOLS ]
- ocr_document                 - calculate_step_by_step       - generate_docx
- extract_pdf                  - execute_python_sandbox       - generate_xlsx
- read_excel                   - python.calculate             - generate_pptx
       |                               |                               |
       +-------------------------------+-------------------------------+
                                       |
                                       v
                       [ STORAGE & KNOWLEDGE TOOLS ]
                       - search_knowledge (Local RAG)
                       - rag_query_codebase (AST/BM25)
```

### 3.1 Tool Categories & Handler Inventory

1. **`DOCUMENT`**:
   - `ocr_document`: PaddleOCR engine for scanned image/PDF extraction.
   - `extract_pdf`: Text, table, and metadata parser for native digital PDFs.
   - `read_excel`: Structural spreadsheet ingestion with cell type inference.
2. **`COMPUTE`**:
   - `calculate_step_by_step`: Deterministic math evaluator with audit traces.
   - `execute_python_sandbox`: Sandboxed Python 3.11 environment for data science and AST transformations.
3. **`STORAGE`**:
   - `search_knowledge`: Vector embeddings and BM25 hybrid search over local knowledge bases.
   - `rag_query_codebase`: Syntax-aware AST indexer for repository symbol lookups.
4. **`DATA`**:
   - `python.analyzeData`: Statistical aggregation and outlier detection.
   - `python.embed`: Local vector embedding generator.
   - `python.rerank`: Local cross-encoder result re-ranker.
5. **`DELIVERABLE`**:
   - `generate_docx`: Production-grade executive memos with styled tables and headers.
   - `generate_xlsx`: Multi-tab engineering workbooks with dynamic formulas.
   - `generate_pptx`: Multi-slide executive presentation decks.

### 3.2 RBAC Enforcement & Safety Gates

Before executing any tool on behalf of an agent, the router validates:
1. **Tool Allowlist**: Checks `isToolAllowed(toolName)` against the sovereign policy.
2. **Agent Permission Scope**: Verifies whether the requesting agent possesses the required domain role (e.g. only `DOCUMENT` agents can invoke OCR tools).
3. **Parameter Validation**: Enforces JSON schema validation on all tool arguments.

---

## 4. Agent Router Deep Dive

The **Agent Router** decides whether a user request should be executed by:
1. An **External Integrated Agent** (`hermes`, `opencode`, `codex`, `openclaw`, `pi`, `copilot-cli`).
2. A **Built-in Specialist Agent** (Agents `001` through `300`).
3. The **Super AI Master Orchestrator** (Agent `101` / `301`) for multi-agent DAG execution.

```
                              INCOMING USER REQUEST
                                        |
                                        v
+-------------------------------------------------------------------------------+
| 1. INTENT & DOMAIN CLASSIFICATION                                             |
|    - Technology stack (Node, Python, C++, SQL, Docker, React, etc.)           |
|    - Task category (Coding, Database, DevOps, Math, Document, Research)       |
|    - Complexity score (Simple vs Multi-Stage DAG)                             |
+-------------------------------------------------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
| 2. CANDIDATE AGENT DISCOVERY & AVAILABILITY CHECK                             |
|    - Probe external agent status via discoverAgent(agentId)                   |
|    - Check built-in specialist registry (registry/sih-agent-mapping.json)     |
+-------------------------------------------------------------------------------+
                                        |
                 +----------------------+----------------------+
                 |                                             |
                 v                                             v
     [ Single-Domain Task ]                       [ Multi-Stage / Complex Task ]
     +-------------------------------+            +-------------------------------+
     | Check External Agent First    |            | Route to Agent 101/301        |
     | (e.g. OpenCode for Refactor)  |            | (Super AI Master Orchestrator)|
     |                               |            |                               |
     | If NOT_INSTALLED ->           |            | Builds DAG selecting minimal  |
     | Fallback to Built-in          |            | specialist team:              |
     | Specialist (001-300)          |            | [Agent A] -> [Agent B] -> ... |
     +-------------------------------+            +-------------------------------+
```

### 4.1 Capability-to-Agent Routing Matrix

| Intent / Capability | Primary External Agent | Fallback Built-in Specialist | Candidate Models |
|---|---|---|---|
| `CODE_GENERATION` | **OpenCode Agent** (`opencode`) | `agent-061` (Node.js) / `agent-055` (Python) | `qwen2.5-coder:1.5b` |
| `DEBUGGING` | **Hermes Agent** (`hermes`) | `agent-061` (Full-Stack Debugger) | `qwen2.5-coder:1.5b`, `nemotron-3-nano` |
| `TERMINAL_COMMANDS` | **Copilot CLI** (`gh`) / `codex` | `agent-080` (DevOps & Shell) | `nemotron-3-nano`, `qwen2.5-coder:1.5b` |
| `FILE_OPERATIONS` | **OpenClaw Agent** (`openclaw`) | `agent-044` (File Organization) | `qwen2.5-coder:1.5b`, `llama3.2:1b` |
| `MATH_AND_SCIENCE` | **Pi Agent** (`pi`) | `agent-048` (Data Analysis & Math) | `phi4-mini`, `falcon3-1b-instruct` |
| `DOCUMENT_OCR_PDF` | Built-in Engine (`local-vision-ocr`)| `agent-045` (PDF Processing) | `PaddleOCR 3.7.0` + `granite4:1b-h` |
| `SYSTEM_AUDITING` | **Hermes Agent** (`hermes`) | `agent-101` (Super AI Master) | `nemotron-3-nano` |

---

## 5. "WHY THIS ROUTE?" Explainability Trace Architecture

Every routing decision generates a structured, cryptographically recorded trace that is surfaced in the Liquid Glass UI and recorded in the audit log.

```
+---------------------------------------------------------------------------------------------------+
|                                 "WHY THIS ROUTE?" TRACE STRUCTURE                                 |
+---------------------------------------------------------------------------------------------------+
|  requestId          : Unique trace identifier (e.g. req-1740324800-abc12)                         |
|  timestamp          : ISO 8601 execution timestamp                                                |
|  userInput          : Original sanitized prompt text                                              |
|  intent             : Categorized intent token (e.g. CODE_REFACTORING)                            |
|  candidates         : List of evaluated agent candidate IDs                                       |
|  selectedAgent      : Chosen agent object { id, name, type, role }                                |
|  selectedModel      : Allocated local model { id, name, executionTarget, vramMb }                 |
|  executionTarget    : "GPU" (RTX 2050) or "CPU" (Intel i5-11400H)                                 |
|  selectedTools      : Array of tool names bound to the execution step                             |
|  routingDurationMs  : Total time taken to compute routing graph (typically <15ms)                 |
|  confidence         : Heuristic confidence score (0.0 to 1.0)                                     |
|  policyEnforced     : "LOCAL_ONLY" air-gap compliance guarantee                                   |
|  factors            : Weighted factor analysis array [ { factor, value, weight } ]                |
|  alternatives       : Evaluated but unselected alternatives with rationale                        |
+---------------------------------------------------------------------------------------------------+
```

---

## 6. 5 Concrete End-to-End Routing Examples

### Example 1: Full-Stack Code Refactoring & Unit Test Synthesis

**User Prompt**: *"Refactor the authentication token verification logic in `server.js` and write a comprehensive unit test suite using `node:test`."*

```json
{
  "requestId": "req-20260827-001-code",
  "timestamp": "2026-08-27T14:20:21.100Z",
  "userInput": "Refactor the authentication token verification logic in server.js and write a comprehensive unit test suite using node:test.",
  "intent": "CODE_REFACTORING_AND_TESTING",
  "candidates": ["opencode", "hermes", "agent-061", "agent-085"],
  "selectedAgent": {
    "id": "opencode",
    "name": "OpenCode Agent",
    "type": "EXTERNAL_INTEGRATION",
    "role": "Lead Coding Specialist"
  },
  "selectedModel": {
    "id": "qwen2.5-coder:1.5b",
    "name": "Qwen 2.5 Coder 1.5B (Q4_K_M)",
    "executionTarget": "GPU",
    "vramMb": 1200
  },
  "executionTarget": "GPU",
  "selectedTools": ["rag_query_codebase", "execute_python_sandbox"],
  "routingDurationMs": 11,
  "confidence": 0.98,
  "policyEnforced": "LOCAL_ONLY",
  "factors": [
    { "factor": "Task Modality", "value": "Code & AST Manipulation", "weight": 1.0 },
    { "factor": "Model Benchmark", "value": "Qwen 2.5 Coder highest AST score", "weight": 0.95 },
    { "factor": "VRAM Utilization", "value": "1.2GB within 4.0GB budget", "weight": 0.90 }
  ],
  "alternatives": [
    { "agentId": "agent-061", "reason": "Built-in Node.js agent was candidate; OpenCode selected for dedicated refactoring tools." },
    { "modelId": "nemotron-3-nano", "reason": "Higher reasoning capacity, but higher VRAM overhead (2.8GB)." }
  ]
}
```

---

### Example 2: Mathematical Fluid Dynamics & Valve Cavitation Proof

**User Prompt**: *"Calculate the pressure drop across Control Valve CV-102 with flow rate Q=450 m3/h, fluid density 850 kg/m3, and verify whether cavitation index sigma exceeds 0.65."*

```json
{
  "requestId": "req-20260827-002-math",
  "timestamp": "2026-08-27T14:20:22.450Z",
  "userInput": "Calculate the pressure drop across Control Valve CV-102 with flow rate Q=450 m3/h, fluid density 850 kg/m3, and verify whether cavitation index sigma exceeds 0.65.",
  "intent": "MATHEMATICAL_ENGINEERING_COMPUTATION",
  "candidates": ["pi", "agent-048", "agent-010"],
  "selectedAgent": {
    "id": "agent-048",
    "name": "Data Analysis & Math Agent",
    "type": "BUILTIN_SPECIALIST",
    "role": "Industrial Compute Specialist"
  },
  "selectedModel": {
    "id": "phi4-mini",
    "name": "Microsoft Phi-4 Mini (3.8B Q4_K_M)",
    "executionTarget": "GPU",
    "vramMb": 2400
  },
  "executionTarget": "GPU",
  "selectedTools": ["calculate_step_by_step", "python.calculate"],
  "routingDurationMs": 14,
  "confidence": 0.96,
  "policyEnforced": "LOCAL_ONLY",
  "factors": [
    { "factor": "Domain Classification", "value": "Fluid Dynamics & Algebraic Proofs", "weight": 1.0 },
    { "factor": "Model Strength", "value": "Phi-4 Mini STEM & Math specialization", "weight": 0.98 },
    { "factor": "Deterministic Tool", "value": "Python compute kernel for zero arithmetic error", "weight": 1.0 }
  ],
  "alternatives": [
    { "agentId": "pi", "reason": "External Pi agent candidate; built-in Agent 048 chosen for direct Python kernel bindings." },
    { "modelId": "falcon3-1b-instruct", "reason": "Falcon3 is capable in STEM, but Phi-4 has superior multi-step algebra derivation." }
  ]
}
```

---

### Example 3: Scanned NDT Ultrasonic Inspection & Executive DOCX Briefing

**User Prompt**: *"Analyze the attached scanned ultrasonic thickness inspection report for Heat Exchanger HX-204 and prepare an official Outage Approval Note in DOCX format."*

```json
{
  "requestId": "req-20260827-003-ocr-doc",
  "timestamp": "2026-08-27T14:20:23.820Z",
  "userInput": "Analyze the attached scanned ultrasonic thickness inspection report for Heat Exchanger HX-204 and prepare an official Outage Approval Note in DOCX format.",
  "intent": "MULTIMODAL_INSPECTION_AND_DELIVERABLE",
  "candidates": ["agent-045", "agent-101", "agent-004", "agent-049"],
  "selectedAgent": {
    "id": "agent-101",
    "name": "Super AI Master Orchestrator",
    "type": "MASTER_ORCHESTRATOR",
    "role": "Multi-Agent Workflow Coordinator"
  },
  "selectedModel": {
    "id": "granite4:1b-h",
    "name": "IBM Granite 4 1B-H (Q4_K_M)",
    "executionTarget": "GPU",
    "vramMb": 1200
  },
  "executionTarget": "GPU",
  "selectedTools": ["ocr_document", "extract_pdf", "generate_docx", "search_knowledge"],
  "routingDurationMs": 18,
  "confidence": 0.99,
  "policyEnforced": "LOCAL_ONLY",
  "factors": [
    { "factor": "Multi-Stage Requirement", "value": "OCR Extraction -> Safety Audit -> DOCX Synthesis", "weight": 1.0 },
    { "factor": "Vision Engine", "value": "PaddleOCR 3.7.0 for table extraction on CPU", "weight": 1.0 },
    { "factor": "RAG Model Selection", "value": "IBM Granite 4 for structured tool and table parsing", "weight": 0.92 }
  ],
  "alternatives": [
    { "agentId": "agent-045", "reason": "Agent 045 assigned as subtask specialist inside Agent 101's DAG plan." },
    { "modelId": "nemotron-3-nano", "reason": "Nemotron invoked during Stage 3 synthesis; Granite 4 utilized for extraction." }
  ]
}
```

---

### Example 4: Shell Automation & Hardened Security Audit

**User Prompt**: *"Generate a hardened PowerShell script to inspect local listening ports, detect unauthorized services, and verify SHA256 integrity of system binaries."*

```json
{
  "requestId": "req-20260827-004-shell",
  "timestamp": "2026-08-27T14:20:25.150Z",
  "userInput": "Generate a hardened PowerShell script to inspect local listening ports, detect unauthorized services, and verify SHA256 integrity of system binaries.",
  "intent": "TERMINAL_AUTOMATION_AND_SECURITY",
  "candidates": ["hermes", "copilot-cli", "agent-080", "agent-071"],
  "selectedAgent": {
    "id": "hermes",
    "name": "Hermes Agent",
    "type": "EXTERNAL_INTEGRATION",
    "role": "Autonomous Tool & Terminal Specialist"
  },
  "selectedModel": {
    "id": "nemotron-3-nano",
    "name": "NVIDIA Nemotron 3 Nano (Q4_K_M)",
    "executionTarget": "GPU",
    "vramMb": 2840
  },
  "executionTarget": "GPU",
  "selectedTools": ["rag_query_codebase", "execute_python_sandbox"],
  "routingDurationMs": 12,
  "confidence": 0.95,
  "policyEnforced": "LOCAL_ONLY",
  "factors": [
    { "factor": "Security & Shell Logic", "value": "Multi-tool terminal commands with security guardrails", "weight": 1.0 },
    { "factor": "Deep Reasoning", "value": "Nemotron 3 Nano statutory compliance and hardening logic", "weight": 0.96 },
    { "factor": "Sandbox Confinement", "value": "Workspace jail enforced at workspace/agents/hermes/", "weight": 1.0 }
  ],
  "alternatives": [
    { "agentId": "copilot-cli", "reason": "Copilot CLI is terminal-focused but lacked multi-step auditing tools available in Hermes." },
    { "modelId": "qwen2.5-coder:1.5b", "reason": "Qwen is proficient at code syntax, but Nemotron provides superior security reasoning." }
  ]
}
```

---

### Example 5: High-Throughput Metadata Extraction Under GPU Lock

**User Prompt**: *"Extract student enrollment records, course IDs, and GPA values from the attached tabular text and format as structured JSON." (Scenario: GPU Mutex is occupied by an ongoing engineering simulation)*

```json
{
  "requestId": "req-20260827-005-cpu-fallback",
  "timestamp": "2026-08-27T14:20:26.300Z",
  "userInput": "Extract student enrollment records, course IDs, and GPA values from the attached tabular text and format as structured JSON.",
  "intent": "STRUCTURED_DATA_EXTRACTION",
  "candidates": ["agent-048", "openclaw", "agent-005"],
  "selectedAgent": {
    "id": "agent-048",
    "name": "Data Analysis Agent",
    "type": "BUILTIN_SPECIALIST",
    "role": "Data Transformation Specialist"
  },
  "selectedModel": {
    "id": "lfm2.5-350m",
    "name": "Liquid AI LFM2.5 350M",
    "executionTarget": "CPU",
    "vramMb": 0
  },
  "executionTarget": "CPU",
  "selectedTools": ["read_excel", "python.analyzeData"],
  "routingDurationMs": 6,
  "confidence": 0.94,
  "policyEnforced": "LOCAL_ONLY",
  "factors": [
    { "factor": "GPU Mutex State", "value": "BUSY (Slot locked by Nemotron 3)", "weight": 1.0 },
    { "factor": "Task Modality", "value": "Structured Key-Value Extraction (No deep logic required)", "weight": 0.95 },
    { "factor": "Hardware Path", "value": "Lock-free CPU execution on Intel Core i5-11400H (0 MB VRAM)", "weight": 1.0 }
  ],
  "alternatives": [
    { "modelId": "qwen2.5-coder:1.5b", "reason": "GPU candidate rejected to avoid queuing latency behind active GPU lock." },
    { "modelId": "rwkv7-0.4b", "reason": "RWKV-7 evaluated; LFM2.5 selected for higher JSON schema alignment precision." }
  ]
}
```

---

## 7. Network Policy Impact on Routing Decisions

The Network Policy Service (`platform/agents/network-policy.js`) acts as an immutable boundary condition during routing resolution:

```
+---------------------------------------------------------------------------------------------------+
|                                  NETWORK POLICY ROUTING IMPACT                                    |
+---------------------------------------------------------------------------------------------------+

                          +---------------------------------------+
                          |        ACTIVE NETWORK POLICY          |
                          +---------------------------------------+
                                              |
                     +------------------------+------------------------+
                     |                                                 |
                     v                                                 v
           [ MODE: LOCAL_ONLY ]                              [ MODE: ALLOW_EXTERNAL ]
  +-------------------------------------+           +-------------------------------------+
  | • External cloud APIs disabled      |           | • External web hooks permitted      |
  | • Ollama endpoint locked to         |           | • Cloud fallback candidates allowed |
  |   http://127.0.0.1:11434            |           | • Proxy variables retained in env   |
  | • PaddleOCR endpoint locked to      |           | • Outbound HTTP calls logged to     |
  |   http://127.0.0.1:8305             |           |   egress audit trail                |
  | • External tool candidates pruned   |           |                                     |
  | • Proxy env vars stripped           |           |                                     |
  | • Egress violations logged to disk  |           |                                     |
  +-------------------------------------+           +-------------------------------------+
```

### Policy Comparison Matrix

| Routing Dimension | `LOCAL_ONLY` Mode (Default) | `ALLOW_EXTERNAL` Mode |
|---|---|---|
| **Model Endpoints** | Strictly `127.0.0.1:11434` & `127.0.0.1:8305` | Local endpoints + optional approved edge gateways |
| **Model Candidate Set**| 8 Local GPU + 4 Local CPU models only | Local models + external API endpoints |
| **Tool Execution** | Offline binaries, local Python, native doc engines | Local tools + outbound webhooks/fetchers |
| **Agent Environment** | `HTTP_PROXY` stripped, `NO_PROXY=*` forced | System environment variables preserved |
| **Violation Action** | Immediate TCP drop + audit log in `network-policy.log` | Allowed + recorded in egress telemetry |
| **Air-Gap Compliance**| **100% Guaranteed** | Conditionally governed |
