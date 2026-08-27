# Sovereign AI Workbench — Agent Integration Architecture

**Document Version**: 2.0.0  
**Platform**: Sovereign AI Workbench — Industrial On-Premise AI Platform  
**Target Hardware Profile**:
- **CPU**: Intel Core i5-11400H (6 Cores / 12 Threads @ 2.70 GHz base, 4.50 GHz boost)
- **GPU**: NVIDIA GeForce RTX 2050 Mobile (4 GB GDDR6 VRAM, 2048 CUDA Cores)
- **System Memory**: 16 GB DDR4 RAM (Air-gapped)
- **Host OS**: Windows 11 Enterprise (x64)
- **Air-Gap Security Guarantee**: 100% Local Execution · Zero Cloud Egress · Strict Egress Blackhole

---

## 1. Executive Summary & Three-Layer Architecture Overview

The **Sovereign AI Workbench** is an air-gapped, zero-cloud enterprise orchestrator that bridges deterministic industrial tools, local open-weight large language models, and autonomous specialist agents. The architecture operates across **three synchronized, decoupled layers** governed by the **301 Super AI Master Orchestrator**:

```
+---------------------------------------------------------------------------------------------------+
|                                     301 SUPER AI ORCHESTRATOR                                     |
|            [ Intent Classifier ]  -->  [ DAG Planner ]  -->  [ Replanner (Max 3 Loops) ]          |
+---------------------------------------------------------------------------------------------------+
                                                  |
       +------------------------------------------+------------------------------------------+
       |                                          |                                          |
       v                                          v                                          v
+------------------------------+  +-------------------------------+  +------------------------------+
| LAYER 1: MODEL LAYER         |  | LAYER 2: AGENT INTEGRATION    |  | LAYER 3: TOOL & DATA LAYER   |
|                              |  |                              |  |                              |
| [ GPU Tier - RTX 2050 4GB ]  |  | [ External Agent Integrations]|  | [ Document & Vision Engine ] |
| - Nemotron 3 Nano (4B Q4_K_M)|  | - Hermes Agent (TII)         |  | - PaddleOCR 3.7.0 (ONNX/CPU) |
| - Qwen 2.5 Coder 1.5B Q4_K_M |  | - OpenCode Agent (OpenSource)|  | - PDF / Scanned Document OCR |
| - Microsoft Phi-4 Mini (3.8B)|  | - Codex Agent (OpenAI/Local) |  | - Excel Sheet Reader         |
| - IBM Granite 4 1B-H Q4_K_M  |  | - OpenClaw Agent (Community) |  |                              |
| - Meta Llama 3.2 1B Q4_K_M   |  | - Pi Agent (Inflection/Local)|  | [ Industrial Compute Engine] |
| - Google Gemma 3 1B Q4_K_M   |  | - Copilot CLI (GitHub CLI)   |  | - Python Compute Sandbox     |
| - SmolLM2 1.7B Q8_0          |  |                              |  | - Step-by-Step Calculator    |
| - Falcon3 1B Instruct Q4_K_M |  | [ Built-in Specialist Agents]|  |                              |
|                              |  | - Agents 001 - 300           |  | [ Deliverable Generators ]   |
| [ CPU Tier - Intel i5 CPU ]  |  | - Agent 101/301 Super AI     |  | - Native DOCX / XLSX / PPTX  |
| - Liquid AI LFM2.5 350M      |  |                              |  |                              |
| - RWKV-7 0.4B (mollysama)    |  | [ Integration Services ]     |  | [ Knowledge & Storage ]      |
| - TinyLlama 1.1B (Chat)      |  | - Discovery (`where.exe`)    |  | - Local Vector RAG & BM25    |
| - Stable LM 2 1.6B           |  | - Launcher & Sandboxing      |  | - SQLite Institutional DB    |
|                              |  | - Session Manager            |  | - Codebase AST Indexer       |
| [ GPU Mutex Lock: Max = 1 ]  |  | - Capability Matrix          |  |                              |
| [ CPU Lock-Free Parallel ]   |  | - Health State Machine       |  | [ RBAC Permission Gate ]     |
+------------------------------+  +-------------------------------+  +------------------------------+
                                                  |
+---------------------------------------------------------------------------------------------------+
|                                  SECURITY & NETWORK POLICY LAYER                                  |
|      [ Network Policy: LOCAL_ONLY ]  |  [ Sandbox Jail ]  |  [ Destructive Command Filter ]       |
+---------------------------------------------------------------------------------------------------+
```

### Core Architecture Pillars

1. **Hardware-Tiered Isolation**: GPU inference is bounded to 4GB VRAM with single-tenant mutex locking (`MAX_GPU_CONCURRENCY = 1`), while CPU inference runs parallel and lock-free across 12 logical cores.
2. **Decoupled Agent-to-Model Mapping**: External agents never hardcode models. The Model Router dynamically selects and allocates the optimal local engine based on task requirements, memory constraints, and runtime availability.
3. **Strict Sandboxed Execution**: External agent processes are launched inside isolated workspace directories (`workspace/agents/<agent-id>/`) with zero proxy egress and sanitized environment variables.
4. **Deterministic Tool Grounding**: Non-deterministic LLM hallucinations are eliminated by chaining local Python compute kernels, OCR layout parsers, and tamper-evident cryptographic audit logs.

---

## 2. Layer 1 — Model Layer Architecture

The model execution layer guarantees sub-second responsiveness without triggering VRAM overflow or system paging on consumer-grade hardware.

```
                                      MODEL ROUTER / DISPATCHER
                                                  |
                        +-------------------------+-------------------------+
                        |                                                   |
                        v                                                   v
             GPU EXECUTION TIER                                    CPU EXECUTION TIER
          (execution_target: "GPU")                             (execution_target: "CPU")
       +-----------------------------+                       +-----------------------------+
       | • Nemotron 3 Nano (2.84 GB) |                       | • Liquid AI LFM2.5 (379 MB) |
       | • Qwen 2.5 Coder (1.20 GB)  |                       | • RWKV-7 0.4B (501 MB)      |
       | • Microsoft Phi-4 (2.40 GB) |                       | • TinyLlama 1.1B (637 MB)   |
       | • IBM Granite 4 (1.20 GB)   |                       | • Stable LM 2 1.6B (982 MB) |
       | • Meta Llama 3.2 (1.30 GB)  |                       | • PaddleOCR 3.7.0 (CPU/ONNX)|
       | • Google Gemma 3 (1.10 GB)  |                       +--------------+--------------+
       | • SmolLM2 1.7B (1.80 GB)    |                                      |
       | • Falcon3 1B (1.30 GB)      |                                      | Parallel / Lock-Free
       +--------------+--------------+                                      v
                      |                                            Intel Core i5-11400H
                      | Strict Mutex (MAX_CONCURRENCY = 1)         (num_gpu: 0 · 12 Cores)
                      v
             NVIDIA RTX 2050 (4GB)
             (CUDA Acceleration)
```

### 2.1 Complete Production Model Inventory

| # | Model Identifier | Ollama Tag / URI | Provider | Parameters | Quantization | Target | VRAM / RAM | Primary Specialization |
|---|---|---|---|---|---|---|---|---|
| 1 | **NVIDIA Nemotron 3 Nano** | `nemotron-3-nano:latest` | NVIDIA | 3.8B | Q4_K_M | GPU | 2,840 MB | Master orchestration, deep reasoning, audit analysis |
| 2 | **Qwen 2.5 Coder 1.5B** | `qwen2.5-coder:1.5b` | Alibaba / Qwen | 1.5B | Q4_K_M | GPU | 1,200 MB | AST parsing, code synthesis, shell automation |
| 3 | **Microsoft Phi-4 Mini** | `phi4-mini` | Microsoft | 3.8B | Q4_K_M | GPU | 2,400 MB | STEM deduction, engineering math, formal logic |
| 4 | **IBM Granite 4 1B-H** | `granite4:1b-h` | IBM Research | 1.0B | Q4_K_M | GPU | 1,200 MB | Enterprise RAG, structured tool calling, schema mapping |
| 5 | **Meta Llama 3.2 1B** | `llama3.2:1b` | Meta AI | 1.2B | Q4_K_M | GPU | 1,300 MB | Fast conversational Q&A, rewriting, low-latency chat |
| 6 | **Google Gemma 3 1B** | `gemma3:1b` | Google DeepMind | 1.0B | Q4_K_M | GPU | 1,100 MB | Dense edge NLP, grounded extraction, summarization |
| 7 | **SmolLM2 1.7B** | `smollm2:1.7b` | Hugging Face | 1.7B | Q8_0 | GPU | 1,800 MB | High-throughput text transformation, token streaming |
| 8 | **Falcon3 1B** | `falcon3:1b-instruct-q4_K_M` | TII | 1.67B | Q4_K_M | GPU | 1,300 MB | Technical science QA, mathematical calculations |
| 9 | **Liquid AI LFM2.5 350M** | `LiquidAI/lfm2.5-350m` | Liquid AI | 354M | Q8_0 | CPU | 466 MB RAM | Structured JSON extraction, CPU routing fallback |
| 10| **RWKV-7 0.4B** | `mollysama/rwkv-7-g1d:0.4b` | RWKV Foundation | 450M | Q8_0 | CPU | 547 MB RAM | RNN/Transformer hybrid fast rewriting, text cleanup |
| 11| **TinyLlama 1.1B** | `tinyllama:1.1b-chat` | TinyLlama | 1.1B | Q4_0 | CPU | 637 MB RAM | Lightweight fallback chat, simple formatting |
| 12| **Stable LM 2 1.6B** | `stablelm2:1.6b` | Stability AI | 1.6B | Q4_0 | CPU | 982 MB RAM | Multilingual text transformation, report drafting |
| 13| **PaddleOCR 3.7.0** | `paddleocr-engine` | PaddlePaddle / ONNX | N/A | FP32 / Int8 | CPU | 1,024 MB RAM | Multilingual document OCR, table layout extraction |

### 2.2 GPU Mutex & Slot Allocation Algorithm

To prevent CUDA out-of-memory errors on 4GB VRAM hardware, the system enforces a strict FIFO mutex lock (`platform/models/model-lifecycle.js`):
1. **Slot Acquisition**: Before dispatching inference, `acquireModelSlot(modelId)` checks if a model is loaded in VRAM.
2. **Deterministic Eviction**: If another GPU model occupies VRAM, the runtime waits for active generation to finish or issues an unload command (`keep_alive: 0`) to Ollama before loading the target model.
3. **CPU Bypass**: CPU models (`execution_target: "CPU"`) completely bypass the GPU Mutex lock with `num_gpu: 0`, enabling parallel background execution.

---

## 3. Layer 2 — Agent Integration Layer

The Agent Integration Layer provides a modular runtime for running external CLI and autonomous coding agents alongside the 300 built-in specialist agents.

```
                               +----------------------------------------+
                               |     AGENT INTEGRATION DISPATCHER       |
                               +----------------------------------------+
                                                    |
       +---------------------+----------------------+---------------------+---------------------+
       |                     |                      |                     |                     |
       v                     v                      v                     v                     v
+---------------+     +---------------+      +---------------+     +---------------+     +---------------+
|  DISCOVERY    |     |  LAUNCHER     |      |  SESSION MGR  |     |  CAPABILITY   |     |  PERMISSIONS  |
|  ENGINE       |     |  & SANDBOX    |      |  & TURNS      |     |  MATRIX       |     |  & RBAC GATE  |
| `where.exe` / |     | `spawn()`     |      | UUID Sessions |     | Intent-to-Cap |     | Destructive   |
| version check |     | Stdio pipes   |      | JSON Store    |     | Matcher       |     | Pattern Filter|
+---------------+     +---------------+      +---------------+     +---------------+     +---------------+
       |                     |                      |                     |                     |
       +---------------------+----------------------+---------------------+---------------------+
                                                    |
                                                    v
                       +--------------------------------------------------------+
                       |               6 INTEGRATED AGENT ENGINES               |
                       |  [Hermes] [OpenCode] [Codex] [OpenClaw] [Pi] [Copilot] |
                       +--------------------------------------------------------+
```

### 3.1 Integrated External Agents

| Integration ID | Agent Name | Provider | Binary | Primary Capabilities | Default Model | Workspace Directory |
|---|---|---|---|---|---|---|
| `hermes` | **Hermes Agent** | TII | `hermes` | `CODE_GENERATION`, `DEBUGGING`, `FILE_OPERATIONS`, `TERMINAL_COMMANDS`, `REFACTORING` | `nemotron-3-nano` | `workspace/agents/hermes` |
| `opencode` | **OpenCode Agent** | Open Source | `opencode` | `CODE_GENERATION`, `CODE_REVIEW`, `DEBUGGING`, `REFACTORING` | `qwen2.5-coder:1.5b` | `workspace/agents/opencode` |
| `codex` | **Codex Agent** | OpenAI (Local CLI) | `codex` | `CODE_GENERATION`, `DEBUGGING`, `REFACTORING`, `TERMINAL_COMMANDS` | `nemotron-3-nano` | `workspace/agents/codex` |
| `openclaw` | **OpenClaw Agent** | Community | `openclaw` | `CODE_GENERATION`, `CODE_REVIEW`, `DEBUGGING`, `FILE_OPERATIONS` | `qwen2.5-coder:1.5b` | `workspace/agents/openclaw` |
| `pi` | **Pi Agent** | Inflection (Local CLI) | `pi` | `GENERAL_CHAT`, `MATH`, `SCIENCE` | `llama3.2:1b` | `workspace/agents/pi` |
| `copilot-cli`| **GitHub Copilot CLI**| Microsoft / GitHub | `gh` | `CODE_GENERATION`, `TERMINAL_COMMANDS` | `nemotron-3-nano` | `workspace/agents/copilot-cli`|

### 3.2 Agent Discovery Engine (`platform/agents/agent-discovery.js`)

The discovery engine runs non-blocking local environmental inspection:
- **Binary Resolution**: Uses `where.exe <binary>` on Windows hosts to locate absolute executable paths.
- **Version Verification**: Executes `<binary> --version` or `<binary> copilot --version` with strict 3000ms timeouts.
- **Dynamic State Refresh**: Emits events when new binaries become available or path bindings change.

```javascript
// Discovery Flow
export async function discoverAgent(agentId) {
  const registry = loadRegistry();
  const agent = registry.integrations.find(a => a.id === agentId);
  if (!agent) return { id: agentId, installed: false, path: null, version: null };

  const binPath = getAgentBinaryPath(agentId);
  if (!binPath) return { id: agentId, installed: false, path: null, version: null };

  let version = null;
  try {
    const { command, args } = agent.install_check;
    const versionOutput = execSync(`${command} ${args.join(' ')}`, { encoding: 'utf-8', timeout: 3000 });
    version = versionOutput.trim();
  } catch (err) { /* graceful fallback */ }

  return { id: agentId, installed: true, path: binPath, version };
}
```

### 3.3 Agent Launcher & Sandbox (`platform/agents/agent-launcher.js`)

When an agent task is triggered:
1. **Directory Isolation**: Ensures target directory `workspace/agents/<name>/` exists.
2. **Environment Sanitization**: Invokes `networkPolicy.enforceOnProcess(env)` to delete external proxy environment variables (`HTTP_PROXY`, `HTTPS_PROXY`) and force `NO_PROXY=*`.
3. **Child Process Spawning**: Spawns child process with isolated standard I/O pipes.
4. **Log Streaming**: Asynchronously pipes `stdout` and `stderr` to `runtime/logs/agents/<agent_name>.log`.

### 3.4 Agent Session Manager (`platform/agents/agent-session-manager.js`)

Manages conversational state across interactive multi-turn debugging sessions:
- **UUID Session Keys**: Creates cryptographically distinct sessions via `crypto.randomUUID()`.
- **Turn Log Tracking**: Records every interaction with timestamp, role (`user`, `assistant`, `tool`), input prompt, and generated tokens.
- **Disk Persistence**: Persists session JSON files under `runtime/sessions/agents/<sessionId>.json`.

### 3.5 Agent Capability Matrix (`platform/agents/agent-capability-matrix.js`)

Maps incoming task intents to registered agent capabilities:
- `canAgentHandle(agentId, taskType)`: Boolean validation.
- `findBestAgent(taskIntent, constraints)`: Heuristic matching returning candidate agents filtered by GPU requirement, network constraints, and category.

### 3.6 Agent Health Lifecycle State Machine

```
              [ Binary Discovered ]
+---------------+ ------------> +---------------+
| NOT_INSTALLED |               |   AVAILABLE   |
+---------------+ <------------ +---------------+
              [ Binary Missing ]        |
                                        | launchAgent()
                                        v
+---------------+ <------------ +---------------+
|     ERROR     |               |    RUNNING    |
+---------------+               +---------------+
        |                               |
        | recover                       | stopAgent() / exit
        v                               v
+---------------+ <---------------------+
|    STOPPED    |
+---------------+
```

- **NOT_INSTALLED**: Executable binary not found in system `PATH`.
- **AVAILABLE**: Binary located, version verified, ready for execution.
- **RUNNING**: Process active with valid PID, stdio connected, logs streaming.
- **STOPPED**: Process terminated cleanly via `SIGTERM` or completed execution.
- **ERROR**: Process crashed with non-zero exit code or encountered spawning exception.

---

## 4. Layer 3 — Tool & Data Layer

Layer 3 provides deterministic, offline-capable utilities that ground LLM inference into mathematical and physical reality.

```
+---------------------------------------------------------------------------------------------------+
|                                  LAYER 3: DETERMINISTIC TOOL SUITE                                |
+---------------------------------------------------------------------------------------------------+
  |
  +---> [ DOCUMENT & VISION ]   PaddleOCR 3.7.0 (Tables, Math formulas, Tamil/Hindi/English OCR)
  |                             PDF Text Extractor (layout-aware bounding boxes)
  |                             Excel Data Matrix Parser (.xlsx / .csv)
  |
  +---> [ INDUSTRIAL COMPUTE ]  Isolated Python 3.11 Kernel (NumPy, SciPy, SymPy)
  |                             Step-by-Step Formula & Unit Verifier
  |
  +---> [ DELIVERABLE ENGINE ]  Native DOCX Generator (Executive Briefings & Approval Memos)
  |                             Native XLSX Generator (Multi-sheet engineering data grids)
  |                             Native PPTX Generator (Slide decks with structured cards)
  |
  +---> [ KNOWLEDGE & MEMORY ]  Local Embedding RAG (Cosine similarity over vector store)
  |                             BM25 Keyword Lexical Search
  |                             Codebase AST Symbol Search
  |                             SQLite Institutional Database Engine
  |
  +---> [ BROWSER EMULATION ]   Offline Headless HTML Parser & Local Web Simulator
```

### 4.1 Tool Taxonomy & Handler Mapping

| Category | Tool Name | Module Handler | Execution Target | Air-Gap Guarantee |
|---|---|---|---|---|
| **DOCUMENT** | `ocr_document` | `multimodal/image-question.js` | CPU (PaddleOCR) | 100% Offline (Local Models) |
| **DOCUMENT** | `extract_pdf` | `multimodal/pdf-extractor.js` | CPU (Pdf-Parse) | 100% Offline (In-Memory) |
| **DOCUMENT** | `read_excel` | `services/document-service.js` | CPU (SheetJS) | 100% Offline |
| **COMPUTE** | `calculate_step_by_step` | `compute/python-client.js` | CPU (Python Subprocess) | Sandboxed Local Process |
| **COMPUTE** | `execute_python_sandbox` | `sandbox/code-sandbox.js` | CPU (Python 3.11) | Memory & Time Limited |
| **DELIVERABLE** | `generate_docx` | `deliverables/docx-generator.js` | CPU (docx library) | Native Binary Generation |
| **DELIVERABLE** | `generate_xlsx` | `deliverables/xlsx-generator.js` | CPU (exceljs) | Native Binary Generation |
| **DELIVERABLE** | `generate_pptx` | `deliverables/pptx-generator.js` | CPU (pptxgenjs) | Native Binary Generation |
| **STORAGE** | `search_knowledge` | `knowledge/knowledge-engine.js` | CPU (Local Index) | Local Disk Only |
| **STORAGE** | `rag_query_codebase` | `rag/rag-engine.js` | CPU (Vector/BM25) | Local Workspace Index |

---

## 5. 301 Super AI Master Orchestrator

The Master Orchestrator (Agent 101/301) operates as the cognitive conductor of the workbench. It ingests complex multi-step industrial requests, plans Directed Acyclic Graphs (DAGs), selects the minimal necessary team of agents, and synthesizes final deliverables.

```
                           +-------------------------------------+
                           |         USER REQUEST INGESTION      |
                           +-------------------------------------+
                                              |
                                              v
                           +-------------------------------------+
                           |    1. TASK INTENT CLASSIFICATION    |
                           |    (Domain, Tech, Pattern, Risk)    |
                           +-------------------------------------+
                                              |
                                              v
                           +-------------------------------------+
                           |    2. MINIMAL SPECIALIST TEAM       |
                           |    (Agent 101 + Specialists)        |
                           +-------------------------------------+
                                              |
                                              v
                           +-------------------------------------+
                           |    3. AUTONOMOUS DAG TASK PLANNER   |
                           |    (Stages, Dependencies, Tools)    |
                           +-------------------------------------+
                                              |
                                              v
                           +-------------------------------------+
                           |    4. STEP EXECUTION ENGINE         |
                           |    - Model Allocation (GPU/CPU)     |
                           |    - Tool Invocation & Grounding    |
                           +-------------------------------------+
                                              |
                                              v
                           +-------------------------------------+
                           |    5. EVIDENCE GROUNDING & AUDIT    |
                           +-------------------------------------+
                                         /         \
                       [Discrepancy / Uncertainty] [Verified Valid]
                                       /             \
                                      v               v
                        +--------------------+  +--------------------+
                        | 6. REPLANNER LOOP  |  | 7. DELIVERABLE PKG |
                        | (Max 3 Iterations) |  | (DOCX/XLSX/PPTX)   |
                        +--------------------+  +--------------------+
                                                        |
                                                        v
                                                +--------------------+
                                                | 8. USER STREAM SSE |
                                                +--------------------+
```

### Key Orchestration Phases

1. **Intent Classification**: Analyzes input prompt and attachments to detect technology keywords, complexity score, architectural pattern, and risk level.
2. **Specialist Selection**: Minimally selects relevant agents from the 300 specialist directory and 6 external integrations to avoid token dilution and context pollution.
3. **DAG Generation**: Assembles subtasks into parallel execution stages respecting data dependencies.
4. **Self-Healing Replanning**: If an agent output fails validation or lacks grounding evidence, the Replanner injects targeted recovery subtasks (bounded by `MAX_REPLANS = 3`).

---

## 6. Security Architecture & Egress Control

Security in the Sovereign AI Workbench is strictly defensive and enforced at the kernel, process, and network boundaries.

```
+---------------------------------------------------------------------------------------------------+
|                                   AIR-GAP SECURITY PERIMETER                                      |
+---------------------------------------------------------------------------------------------------+

     [ INCOMING REQUEST ] ---> [ SECRET SANITIZER ] ---> [ WORKSPACE JAIL: workspace/agents/<id>/ ]
                                                                     |
                                                                     v
                                                          [ DESTRUCTIVE FILTER ]
                                                          - rm -rf / del /s
                                                          - DROP/TRUNCATE TABLE
                                                          - mkfs / format
                                                                     |
                                                                     v
                                                          [ NETWORK POLICY SERVICE ]
                                                          - Mode: LOCAL_ONLY
                                                          - Strip HTTP_PROXY/HTTPS_PROXY
                                                          - Force NO_PROXY=*
                                                          - Block non-localhost egress
                                                                     |
                                                                     v
                                                          [ SECURE EXECUTION KERNEL ]
```

### 6.1 Network Policy Service (`platform/agents/network-policy.js`)

- **Default State**: `LOCAL_ONLY`.
- **Egress Interception**: Inspects all outbound connection requests. Any destination other than `localhost`, `127.0.0.1`, or `::1` is immediately dropped and recorded.
- **Violation Logging**: Appends timestamped violation records to `runtime/logs/network-policy.log`.
- **Process Environment Sanitization**:
  ```javascript
  enforceOnProcess(env) {
    const sanitized = { ...env };
    if (this.mode === 'LOCAL_ONLY') {
      delete sanitized.HTTP_PROXY;
      delete sanitized.HTTPS_PROXY;
      delete sanitized.http_proxy;
      delete sanitized.https_proxy;
      sanitized.no_proxy = '*';
    }
    return sanitized;
  }
  ```

### 6.2 Workspace Sandbox Jail

- Each external agent integration is confined to its assigned subdirectory: `workspace/agents/<agentId>/`.
- Path traversal attempts (`../../`) and absolute paths outside the designated workspace root are rejected by `isWorkspaceAccessAllowed(agentId, targetPath)`.

### 6.3 Destructive Command Interceptor (`platform/agents/agent-permissions.js`)

Commands matching the following patterns halt execution and trigger interactive Human-In-The-Loop (HITL) confirmation:
- `rm\s+-rf` / `del\s+\/s` (Mass file deletion)
- `DROP\s+TABLE` / `TRUNCATE\s+TABLE` (Database schema destruction)
- `mkfs` / `format\s+[a-z]:` (Disk formatting)
- `>\s*\/dev\/[a-z]+` (Device redirection)

### 6.4 Secret-Safe Logging

Before logging prompt texts, agent outputs, or execution traces, the logger filters out credential tokens:
- Bearer tokens: `Bearer [REDACTED]`
- OpenAI / Third-party API keys: `sk-[REDACTED]`
- Password fields and private keys.

---

## 7. API Endpoints

The Gateway Server (`port 8300`) exposes the following REST and SSE endpoints for agent integrations:

| HTTP Method | Route Endpoint | Purpose | Request Payload | Response Schema |
|---|---|---|---|---|
| `GET` | `/api/agents/integrations` | List all 6 external integrations & statuses | None | `{ status: "success", integrations: [...] }` |
| `GET` | `/api/agents/integrations/:id` | Get metadata for a specific agent integration | None | `{ status: "success", agent: { ... } }` |
| `POST` | `/api/agents/integrations/:id/discover` | Run binary detection and version check | None | `{ status: "success", installed: bool, path: str, version: str }` |
| `POST` | `/api/agents/integrations/:id/launch` | Launch agent process in workspace sandbox | `{ args: string[], env?: object }` | `{ status: "success", pid: number, status: "RUNNING" }` |
| `POST` | `/api/agents/integrations/:id/stop` | Terminate running agent process | None | `{ status: "success", stopped: bool }` |
| `GET` | `/api/agents/integrations/:id/status` | Query active process status and uptime | None | `{ status: "success", pid: number, uptime: number }` |
| `POST` | `/api/agents/integrations/:id/sessions` | Create a new interactive agent session | `{ metadata?: object }` | `{ status: "success", sessionId: "uuid" }` |
| `POST` | `/api/agents/integrations/:id/sessions/:sid/message` | Post a prompt turn to the agent session | `{ message: string }` | `{ status: "success", turn: { ... } }` |
| `GET` | `/api/agents/integrations/:id/sessions/:sid` | Retrieve full session turn history | None | `{ status: "success", turns: [...] }` |
| `DELETE` | `/api/agents/integrations/:id/sessions/:sid` | Close and persist agent session | None | `{ status: "success", closed: bool }` |
| `GET` | `/api/network-policy` | Query current network policy & egress counts | None | `{ status: "success", mode: "LOCAL_ONLY", externalCalls: 0 }` |
| `POST` | `/api/network-policy` | Switch policy (`LOCAL_ONLY` / `ALLOW_EXTERNAL`) | `{ mode: "LOCAL_ONLY" }` | `{ status: "success", mode: str }` |
| `GET` | `/api/network-policy/violations` | Fetch log of blocked egress attempts | None | `{ status: "success", violations: [...] }` |

---

## 8. Data Contracts & JSON Schemas

### 8.1 Agent Integration Registry Schema (`registry/agent-integrations.json`)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "AgentIntegrationsRegistry",
  "type": "object",
  "required": ["version", "total_integrations", "integrations"],
  "properties": {
    "version": { "type": "string" },
    "updated_at": { "type": "string", "format": "date-time" },
    "platform": { "type": "string" },
    "total_integrations": { "type": "integer" },
    "integrations": {
      "type": "array",
      "items": {
        "type": "object",
        "required": [
          "id", "name", "provider", "description", "binary_name",
          "install_check", "capabilities", "supported_models",
          "default_model", "workspace_dir", "requires_gpu",
          "network_policy", "status", "health_check", "category", "icon"
        ],
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "provider": { "type": "string" },
          "description": { "type": "string" },
          "binary_name": { "type": "string" },
          "install_check": {
            "type": "object",
            "required": ["type", "command", "args"],
            "properties": {
              "type": { "type": "string", "enum": ["binary", "script", "http"] },
              "command": { "type": "string" },
              "args": { "type": "array", "items": { "type": "string" } }
            }
          },
          "capabilities": {
            "type": "array",
            "items": { "type": "string" }
          },
          "supported_models": {
            "type": "array",
            "items": { "type": "string" }
          },
          "default_model": { "type": "string" },
          "workspace_dir": { "type": "string" },
          "requires_gpu": { "type": "boolean" },
          "network_policy": { "type": "string", "enum": ["LOCAL_ONLY", "ALLOW_EXTERNAL"] },
          "status": {
            "type": "string",
            "enum": ["NOT_INSTALLED", "AVAILABLE", "RUNNING", "STOPPED", "ERROR"]
          },
          "health_check": {
            "type": "object",
            "properties": {
              "type": { "type": "string" },
              "interval_ms": { "type": "integer" }
            }
          },
          "category": { "type": "string" },
          "icon": { "type": "string" }
        }
      }
    }
  }
}
```

### 8.2 Execution Trace Contract

```json
{
  "requestId": "req-1740324800-abc12",
  "timestamp": "2026-08-27T14:20:21.000Z",
  "userInput": "Refactor AST parser in server.js and generate unit test suite",
  "intent": "CODE_REFACTORING_AND_TESTING",
  "candidates": ["opencode", "hermes", "agent-061"],
  "selectedAgent": {
    "id": "opencode",
    "name": "OpenCode Agent",
    "type": "EXTERNAL_INTEGRATION"
  },
  "selectedModel": {
    "id": "qwen2.5-coder:1.5b",
    "name": "Qwen 2.5 Coder 1.5B (Q4_K_M)",
    "executionTarget": "GPU",
    "vramMb": 1200
  },
  "selectedTools": ["execute_python_sandbox", "rag_query_codebase"],
  "routingDurationMs": 14,
  "confidence": 0.96,
  "policyEnforced": "LOCAL_ONLY",
  "factors": [
    { "factor": "Data Sovereignty", "value": "Strict Local", "weight": 1.0 },
    { "factor": "Language AST Capability", "value": "Qwen Coder AST Specialist", "weight": 0.95 },
    { "factor": "VRAM Budget", "value": "1.2GB / 4.0GB", "weight": 0.9 }
  ],
  "alternatives": [
    { "agentId": "agent-061", "reason": "Built-in Node.js specialist, secondary preference" },
    { "modelId": "nemotron-3-nano", "reason": "Capable, but higher VRAM overhead (2.8GB vs 1.2GB)" }
  ]
}
```

---

## 9. UI Integration & Visual Components

The Sovereign Workbench UI (Liquid Glass theme) integrates the Agent Integration Layer into two primary components:

### 9.1 AI Agent Integrations Sidebar Section

A dedicated panel in the left sidebar renders live status chips for all 6 external integrations:
- **Status Indicator Dots**:
  - `🟢 AVAILABLE` (Green glowing dot)
  - `🔵 RUNNING` (Blue pulsing dot)
  - `⚪ NOT_INSTALLED` (Muted grey dot)
  - `🔴 ERROR` (Red alert dot)
- **Quick Controls**: One-click Launch, Stop, and Sandbox Directory Explorer buttons.

### 9.2 "WHY THIS ROUTE?" Explainability Panel

Every message response capsule features an expandable glass card displaying real-time routing telemetry:
- Intent Classification badge (`[CODE_GENERATION]`, `[REASONING]`, `[EXTRACTION]`).
- Selected Agent badge with execution runtime.
- Model footprint indicator (`1.2 GB VRAM · GPU` or `0 MB VRAM · CPU ONLY`).
- Hardware path trace (`NVIDIA GeForce RTX 2050` vs `Intel Core i5-11400H`).
- Confidence score and candidate evaluation table.

---

## 10. Desktop Application & IPC Integration

The Electron desktop application (`desktop/main/main.js`) bridges the web interface and system-level process controls via typed IPC channels exposed in `preload.js`:

```
+-----------------------------------------------------------------------------+
|                           ELECTRON DESKTOP LAYER                            |
|                                                                             |
|   [ Renderer Process (Liquid Glass UI) ]                                    |
|              |                                                              |
|              v  window.desktopAPI.invoke(...)                               |
|   [ Preload Bridge (desktop/preload/preload.js) ]                           |
|              |                                                              |
|              v  ipcRenderer.invoke('agents:*' / 'network:*')                |
|   [ Main Process (desktop/main/main.js) ]                                   |
|              |                                                              |
|              +---> ServiceSupervisor.startAll()                             |
|              +---> AgentLauncher (spawn sandboxed binaries)                 |
|              +---> NetworkPolicy (enforce firewall & proxy rules)           |
+-----------------------------------------------------------------------------+
```

### IPC Channel Registry

| IPC Channel Name | Direction | Handler Action |
|---|---|---|
| `agents:list` | Renderer -> Main | Discovers and returns all 6 integrated agents with installation status |
| `agents:launch` | Renderer -> Main | Spawns requested agent binary in workspace sandbox |
| `agents:stop` | Renderer -> Main | Sends graceful `SIGTERM` / `SIGKILL` to running agent process |
| `agents:status` | Renderer -> Main | Returns live PID, CPU load, memory usage, and uptime |
| `network:get-policy` | Renderer -> Main | Reads current Network Policy (`LOCAL_ONLY` vs `ALLOW_EXTERNAL`) |
| `network:set-policy` | Renderer -> Main | Updates firewall and process proxy enforcement state |
| `network:get-violations`| Renderer -> Main | Retrieves append-only log of intercepted egress attempts |
