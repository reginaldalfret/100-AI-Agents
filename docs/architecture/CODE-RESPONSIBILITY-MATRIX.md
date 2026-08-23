# System Code Responsibility Matrix

**Project**: 301 Super AI Agents  
**Platform**: Sovereign AI Workbench (SIH 26117)  
**Standard**: Single Canonical Owner per Architectural Subsystem

---

## 1. Subsystem Responsibility Mapping

| Subsystem | Canonical Owner Directory / File | Core Responsibilities | Technology Stack |
| :--- | :--- | :--- | :--- |
| **API Gateway & Streaming** | `platform/gateway/src/server.js` | HTTP API routing, SSE streaming protocol, rate limiting, and CORS handling | Node.js (HTTP / SSE) |
| **Master Orchestrator (301)** | `platform/workflow-engine/super-ai-workflow-engine.js` | Multi-agent planning, decomposition, subtask scheduling, and synthesis | Node.js (Async Event Stream) |
| **Agent Registry** | `registry/agents.json` | Authoritative definition for all 301 agents (001–301) with categories & capabilities | JSON Schema |
| **Model Routing** | `platform/models/model-registry.js` | Mapping of Gemma, Nemotron, and Qwen to local Ollama endpoints | Node.js (REST / Ollama) |
| **Scope Guard** | `platform/intelligence/agent-scope-guard.js` | Polite domain boundary enforcement and one-click specialist redirection | Node.js RegEx & Intent Analysis |
| **Python Specialized Compute**| `platform/python-compute/` | OCR extraction, computer vision schematics, numerical data analytics | Python 3 (FastAPI / OpenCV) |
| **Document & Vision Intelligence** | `platform/multimodal/` | PDF extraction, DOCX/XLSX/CSV ingestion, visual artifact analysis | Node.js + Python Compute |
| **RAG & Evidence** | `platform/rag/` | Local vector indexing, semantic search, and evidentiary citation retrieval | Node.js (Air-Gapped Local) |
| **Voice & Speech Synthesis** | `platform/voice/` | Real Indian English Female persona, sentence chunking, audio sanitization | Web Speech API / ESM |
| **Visuals & Charting** | `platform/visuals/` | Flowcharts, architecture diagrams, sequence charts, and table visualization | Mermaid.js / SVG / Canvas |
| **Artifact Manager** | `platform/workflow-engine/artifact-manager.js` | Cryptographic provenance (SHA-256), workspace isolation, language validation | Node.js Crypto & FS |
| **Hardware & Metrics** | `platform/system/hardware-provider.js` | Truthful runtime GPU detection (`NVIDIA RTX 2050`) and telemetry traces | Node.js / System CLI |
| **Web Workbench Interface** | `platform/web/app.js` + `index.html` + `styles.css` | Liquid Glass UI, chat composer, conversation history, model switcher, trace view | Vanilla ES6+ / Glassmorphism |
