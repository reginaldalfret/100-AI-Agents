# Next.js Migration Audit & Technical Specification

## 301 SUPER AI — Safe Frontend Modernization
- **Target Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Branch**: `migration/nextjs-frontend`
- **Public Production Endpoint**: https://superai.reginaldalfret.tech
- **Gateway**: Node.js port 8300 (http://127.0.0.1:8300)
- **Hardware & VRAM Boundary**: NVIDIA GeForce RTX 2050 (4GB VRAM) — Strict sequential 1-at-a-time GPU concurrency

---

### 1. Architectural Baseline & Parity Map
The 301 Super AI platform operates as an on-premise industrial AI workbench with:
- **Node.js Central Gateway** (`platform/gateway/src/server.js`): Single port 8300 entry point handling all `/api/*` routes, orchestrating 301 specialized agents, Ollama runtime (port 11434), Python PEFT LoRA runtime (port 8305), and static asset fallback.
- **Frontend Layer**: Next.js App Router inside `platform/web/`.
- **Public Traffic**: Handled by Cloudflare Tunnel routing https://superai.reginaldalfret.tech to http://127.0.0.1:8300.

---

### 2. Route & View Parity Plan
| Feature Route | URL Path | Component | Gateway API Contracts |
|---|---|---|---|
| Agent Workspace | `/agents` (and `/`) | `AgentWorkspace` | `GET /api/agents`, `POST /api/chat`, `GET /api/chats`, `GET /api/models/list` |
| Model Arena | `/arena` | `ModelArena` (4x2 grid) | `POST /api/model-arena/compare` (SSE), `GET /api/model-arena/models`, `POST /api/model-arena/cancel`, `POST /api/model-arena/clear` |
| Personal Style Lab | `/personal-style` | `PersonalStyleLab` | `POST /api/personal-style/gemma/chat` (SSE), `GET /api/personal-style/gemma/status`, `POST /api/personal-style/gemma/reset`, `POST /api/personal-style/gemma/stop` |
| Dataset Intelligence | `/datasets` | `DatasetIntelligence` | `GET /api/datasets`, `POST /api/datasets/query` |
| Fine-Tuning Factory | `/fine-tuning` | `FineTuningFactory` | `GET /api/finetuning/jobs`, `POST /api/finetuning/jobs` |
| Knowledge / Obsidian | `/knowledge` | `KnowledgeView` | `GET /api/knowledge/files`, `GET /api/knowledge/search` |

---

### 3. Strict Concurrency & GPU Constraints
- RTX 2050 (4GB VRAM) cannot execute concurrent LLMs without CUDA Out-Of-Memory (OOM) fatal crashes.
- All Model Arena evaluations MUST execute strictly sequentially via the Gateway sequential queue.
- The 8 active GPU Ollama models:
  1. `nemotron-3-nano`
  2. `gemma3-1b`
  3. `local-code-specialist`
  4. `llama3.2-1b`
  5. `granite4-1b-h`
  6. `phi4-mini`
  7. `smollm2-1.7b`
  8. `falcon3-1b-instruct`

---

### 4. Apple Liquid Glass Design Standards
- Navigation and control elements utilize spatial glass capsules with backdrop blur, specular top highlight, and concentric borders.
- Workspace and conversation content areas maintain clean matte surfaces with high contrast and readable typography.
