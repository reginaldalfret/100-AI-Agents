# 301 SUPER AI — Platform Infrastructure Upgrade Audit
**Generated**: September 8, 2026
**Target Architecture**: Six Core Infrastructure Upgrades
1. Playwright (Real browser E2E test suite)
2. Zod (Runtime schema validation at API boundaries)
3. Unified ModelRuntime (Consistent runtime interface: Ollama, Transformers/PEFT, PersonalStyle)
4. Redis + BullMQ (Background job processing with 1-at-a-time GPU lock for RTX 2050 4GB VRAM)
5. OpenAI-Compatible 301 API (`/v1/chat/completions`, `/v1/models`)
6. OpenTelemetry (Distributed tracing, metrics, sanitized structured logging)

---

## 1. Node.js & Gateway Architecture
- **Runtime**: Node.js v24.18.0 (ESM, `"type": "module"`)
- **Central Gateway**: `platform/gateway/src/server.js` (HTTP server listening on `0.0.0.0:8300`)
- **Public Ingress**: Cloudflare Tunnel mapping `https://superai.reginaldalfret.tech` -> `http://127.0.0.1:8300` (via `~/.cloudflared/config.yml` with `protocol: http2`)
- **Active Endpoints**:
  - `GET /api/health`: Health & telemetry state (status, ollama, python, db, rag, agents, models)
  - `GET /api/models`: Model registry enumeration
  - `POST /api/chat`: Multi-agent chat dispatch and streaming SSE
  - `GET /api/agents`: 301 Autonomous agents catalog
  - `POST /api/model-arena/compare`: Model Arena side-by-side comparison (SSE)
  - `GET /api/model-arena/status`: Comparison state
  - `POST /api/model-arena/cancel`: Abort active comparison
  - `POST /api/model-arena/clear`: Clear comparison state
  - `GET /api/model-arena/models`: Available GPU models
  - `POST /api/personal-style/gemma/chat`: Personal Style Gemma chat (SSE)
  - `GET /api/personal-style/gemma/status`: Runtime health
  - `POST /api/personal-style/gemma/reset`: Session clear
  - `POST /api/personal-style/gemma/stop`: Stop generation
  - `GET /api/datasets/*`: Dataset Intelligence
  - `GET /api/finetuning/*`: QLoRA Fine-Tuning Factory
  - `GET /api/knowledge/*`: Obsidian Knowledge Explorer

---

## 2. Model Routing & Execution Runtimes
- **Authoritative Model Registry**: `platform/models/model-registry.js`
- **Execution Target**: NVIDIA GeForce RTX 2050 Laptop GPU (4096 MB VRAM)
- **Active Local Runtimes**:
  1. **Ollama Runtime** (`http://127.0.0.1:11434`):
     - `nemotron-3-nano` (4B Q4_K_M)
     - `gemma3-1b` (1B Q4_K_M)
     - `local-code-specialist` (Qwen 2.5 Coder 1.5B)
     - `llama3.2-1b` (1B Q4_K_M)
     - `granite4-1b-h` (1B Q4_K_M)
     - `phi4-mini` (3.8B Q4_K_M)
     - `smollm2-1.7b` (1.7B Q4_K_M)
     - `falcon3-1b-instruct` (1B Q4_K_M)
  2. **PyTorch Transformers PEFT Runtime** (`http://127.0.0.1:8305/v1/generate`):
     - `301-gemma-kaviya-style-v1` (Base model `google/gemma-3-1b-it` + LoRA adapter)
  3. **Personal Style Gemma Runtime**:
     - `platform/personal-style/gemma-runtime.js`

---

## 3. Concurrency & Queue Status
- **Current Arena Queue**: In-memory FIFO queue in `platform/model-arena/model-arena-service.js` with boolean gate (`isGenerating`) ensuring strictly 1 model running on GPU at once.
- **Target Improvement**: Production-grade Redis + BullMQ queue subsystem (`platform/jobs/`) with unified GPU lock across Arena, Chat, and Fine-Tuning.

---

## 4. Observability & Logging Status
- Current logs are unstructured stdout/console outputs (`console.log`, `console.error`).
- No distributed tracing or OpenTelemetry instrumentation currently exists.
- Target: Clean OpenTelemetry instrumentation tracing requests from Gateway -> Model Router -> Queue -> Runtime -> SSE stream, with zero PII/prompt leakage.

---

## 5. Test Harness Status
- Unit and integration tests run via `node --test` (223/223 passing).
- Browser E2E tests: Playwright to be installed and configured targeting local Next.js environment and production smoke checks.
