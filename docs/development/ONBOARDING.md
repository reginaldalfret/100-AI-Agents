# Super AI — Developer Onboarding Guide

Welcome to **Super AI**! This guide enables any engineer to set up, understand, extend, and test the entire platform within 10 minutes.

---

## 1. Prerequisites & Environment

- **Operating System**: Windows 10/11 or Windows Server (Production).
- **Runtime**: Node.js v18.0.0+ (ES Modules enabled via `"type": "module"`).
- **Local Model Runner**: Ollama (configured with `OLLAMA_MODELS=E:\Smart Automation\AI\Models\Ollama`).
- **Required Local Models**:
  - `nemotron-3-nano` (NVIDIA Nemotron 3 Reasoning Engine)
  - `gemma3:4b` (Google Gemma 3 Multimodal Vision/OCR Engine)
  - `qwen2.5-coder:1.5b` (Qwen 2.5 Code & Calculation Engine)
- **Authoritative Drive**: `E:\Smart Automation\100-AI-Agents\` (100% of project data lives on `E:`, zero on `C:`).

---

## 2. Quick Start in 3 Commands

```powershell
# 1. Navigate to workspace
cd "E:\Smart Automation\100-AI-Agents"

# 2. Run comprehensive test matrix (28 suites)
npm test

# 3. Start local gateway & web interface (Port 8300)
npm start
```
Open **`http://127.0.0.1:8300/`** in your browser to interact with Super AI.

---

## 3. Extension Guides

### A. How to Add a New Agent
Adding an agent requires **zero changes to core backend code**; it is entirely declarative:
1. Open [`registry/sih-agent-mapping.json`](file:///E:/Smart%20Automation/100-AI-Agents/registry/sih-agent-mapping.json).
2. Append your agent definition with:
   - `id`: `agent-102` (or next sequence)
   - `name`: `AI Boiler Inspection Agent`
   - `domain`: `engineering`
   - `industrial_role`: `Boiler & Steam System Integrity Specialist`
   - `capabilities`: `["boiler_inspection", "asme_sec_i_compliance", "steam_drum_calculation"]`
   - `tools`: `["statutory_limit_checker", "corrosion_rate_calculator"]`
3. The platform gateway (`/api/workforce`) and UI automatically discover and render the new agent on next startup.

### B. How to Add a New Model
1. Register the model profile in [`platform/models/model-registry.json`](file:///E:/Smart%20Automation/100-AI-Agents/platform/models/model-registry.json).
2. Define its capability mapping in [`platform/models/model-router.js`](file:///E:/Smart%20Automation/100-AI-Agents/platform/models/model-router.js).
3. Pull the model locally: `ollama pull <model-tag>`.
4. Run `node tests/benchmark/run-model-benchmark.js` to verify hardware suitability.

### C. How to Add a New Tool
1. Create your tool logic in a dedicated module or export it in [`platform/tools/tool-registry.js`](file:///E:/Smart%20Automation/100-AI-Agents/platform/tools/tool-registry.js).
2. Define its input/output schema:
   ```javascript
   export const myTool = {
     name: "calculate_steam_loss",
     description: "Computes energy loss in kg/hr for leaking steam traps",
     parameters: {
       type: "object",
       properties: {
         orifice_diameter_mm: { type: "number" },
         steam_pressure_bar: { type: "number" }
       },
       required: ["orifice_diameter_mm", "steam_pressure_bar"]
     },
     handler: async (params) => { /* deterministic formula */ }
   };
   ```
3. Register the tool in `toolRegistry.register(myTool)`.

### D. How to Add a New Workflow
1. Create a definition file in [`platform/workflow-engine/definitions/my-workflow.js`](file:///E:/Smart%20Automation/100-AI-Agents/platform/workflow-engine/definitions/).
2. Define the step DAG, participating agents, required deliverables, and HITL risk gates.
3. Export and register in [`platform/workflow-engine/definitions/index.js`](file:///E:/Smart%20Automation/100-AI-Agents/platform/workflow-engine/definitions/index.js).

---

## 4. Naming & Coding Standards

- **Files**: `kebab-case.js` (e.g. `task-planner.js`, `uncertainty-engine.js`).
- **Functions & Methods**: `camelCase` (e.g. `executeAutonomousTask()`, `calculateConfidenceScore()`).
- **Classes**: `PascalCase` (e.g. `EvidenceGraph`, `ModelRouter`).
- **Constants**: `UPPER_SNAKE_CASE` (e.g. `MAX_REPLANS`, `AIR_GAP_PORT`).
- **Agent IDs**: `agent-001` through `agent-100` (specialists), `agent-101` (Super AI orchestrator).
