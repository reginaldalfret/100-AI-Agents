# Real Multi-Model Execution & Fingerprint Verification Report

**Project**: 101 Super AI Agents  
**Platform**: Sovereign AI Workbench  
**Environment**: 100% On-Premise Air-Gapped Local Execution (0 External Network Calls)

---

## 1. Problem Discovered
When users selected distinct models (e.g., **Google Gemma 3**, **NVIDIA Nemotron 3**, or **Qwen 2.5 Coder**) from the frontend dropdown, the request payload was previously not overriding the agent's static configuration model parameter, causing the backend to default to a single model (`nemotron-3-nano`) regardless of UI selection.

---

## 2. Root Cause
1. **Frontend-to-Backend Alias Mismatch**: The UI was sending short identifiers (`gemma`, `nemotron`, `qwen`), which were not resolving to the canonical Ollama model tags (`gemma3:4b`, `nemotron-3-nano:latest`, `qwen2.5-coder:1.5b`).
2. **Missing Model Parameter Forwarding**: Agent execution functions (`directExecution` and `synthesize`) in `agent-101` and specialist agents were relying on hardcoded defaults (`AGENT_CONFIG.model || DEFAULT_MODEL`) rather than prioritizing `request.model_override` or `request.parameters.model`.
3. **No Grounded Verification**: The backend returned display labels without attaching machine-readable telemetry confirming the actual model that performed token generation in local Ollama.

---

## 3. Architecture & Implementation Fix

```
[ Frontend Model Selector ]
        │  (Manual Selection: gemma / nemotron / qwen / auto)
        ▼
[ POST /api/chat ]
        │  Payload: { modelMode: "manual", model_override: "gemma3:4b", ... }
        ▼
[ Gateway Model Dispatcher (server.js) ]
        │  1. Check local Ollama tags (/api/tags)
        │  2. Strict validation: Reject unavailable models (HTTP 503 · NO silent fallback)
        │  3. Set process.env.OLLAMA_MODEL & parameters.model
        ▼
[ Agent Runtime / Agent-101 / Specialists ]
        │  Passes targetModel to generateWithOllama({ model: targetModel })
        ▼
[ Local Ollama Inference (127.0.0.1:11434) ]
        │  POST /api/generate with exact model tag
        │  Captures actual runtime tag, tokens generated, duration_ms
        ▼
[ Grounded Backend Response Metadata ]
        {
          "status": "success",
          "requested_model": "gemma3:4b",
          "actual_model": "gemma3:4b",
          "model": "Google Gemma 3",
          "model_mode": "manual",
          "duration_ms": 1240,
          "tokens_per_sec": 38.4,
          "external_calls": 0
        }
```

---

## 4. Production Model Stack (Canonical Registry)

| Selection ID | Canonical Ollama Tag | Display Name | Primary Specialization | Local Hardware Target |
|---|---|---|---|---|
| `gemma` / `gemma3:4b` | `gemma3:4b` | Google Gemma 3 (4B) | Vision, Multimodal OCR, Diagram Analysis | RTX 2050 (~3.1GB VRAM) |
| `nemotron` / `nemotron-3-nano` | `nemotron-3-nano:latest` | NVIDIA Nemotron 3 Nano | Orchestration, Deep Reasoning, Planning | RTX 2050 (~2.8GB VRAM) |
| `qwen` / `qwen2.5-coder:1.5b` | `qwen2.5-coder:1.5b` | Qwen 2.5 Coder (1.5B) | Code Synthesis, Calculations, SQL Scripts | RTX 2050 (~986MB VRAM) |
| `auto` | Dynamic Selection | Auto (Best Fit) | Contextual routing via task classifier | Dynamic VRAM allocation |

---

## 5. Same-Prompt Multi-Model Benchmark Verification

**Prompt**: `"Write a professional article about renewable energy."`  
**Location**: `tests/benchmarks/multimodel/same-prompt-results.json`

| Model | Actual Runtime Tag | Output Tokens | Total Latency | Generation Speed | Jaccard Word Similarity |
|---|---|---|---|---|---|
| **Google Gemma 3** | `gemma3:4b` | 1,110 tokens | 178,471 ms | 7.28 tokens/sec | **0.250** (vs Nemotron) |
| **NVIDIA Nemotron 3** | `nemotron-3-nano:latest` | 902 tokens | 39,595 ms | 34.93 tokens/sec | **0.189** (vs Qwen) |
| **Qwen 2.5 Coder** | `qwen2.5-coder:1.5b` | 503 tokens | 10,153 ms | 87.68 tokens/sec | **0.162** (vs Gemma) |

> **Key Finding**: Jaccard similarity across model pairs is only **0.16 to 0.25**, proving completely distinct token generation, structure, and vocabulary across the 3 independent models.

---

## 6. Strict Air-Gap & No-Silent-Fallback Rules

1. **No Silent Model Substitution**: If a user manually selects a model that is offline or missing in Ollama, the gateway immediately returns `HTTP 503` with `status: "model_unavailable"`. It never silently defaults to another model.
2. **Zero Cloud Egress**: Every request runs exclusively against `127.0.0.1:11434`. Cloud egress is strictly 0 bytes.
3. **Audit Trail**: Every assistant message records `actualModel`, `modelMode`, `durationMs`, and `traceId` in persistent conversation history.
