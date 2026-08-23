# Codebase Architecture Cleanup Audit

**Project**: 301 Super AI Agents  
**Platform**: Sovereign AI Workbench (SIH 26117)  
**Author**: Sovereign AI Workbench Engineering  
**Generated At**: 2026-08-23T17:08:22.613Z

---

## 1. Full Repository File Inventory

| Category | Count | Description |
| :--- | :--- | :--- |
| **Total Tracked Files** | 2321 | Complete active repository file tree (excluding `.git`, `node_modules`, `archive`) |
| **JavaScript / ESM Modules** | 971 | Platform orchestration, gateway, workflow engine, UI controllers, and tool registries |
| **Python Modules** | 59 | Specialized compute (OCR, vision analysis, numerical computation, RAG preprocessing) |
| **Automated Test Suites** | 251 | Unit, integration, UI, workflow integrity, runtime, and voice test suites |
| **Documentation Files** | 255 | Architecture specifications, verification reports, operations manuals, and developer guides |
| **JSON Schemas & Registries** | 571 | Agent definitions (001–301), model mappings, datasets, and tool contracts |
| **Frontend Templates & Styles**| 104 | Liquid Glass UI layout, CSS variables, icons, and components |

---

## 2. Directory Tree Map

```
E:/Smart Automation/100-AI-Agents/
├── agents/                       # 301 Specialist AI Agents definitions & local backends
├── configuration/                # System runtime & deployment configs
├── data/                         # Persistent local conversation history & metadata
├── docs/
│   ├── architecture/             # Architectural specifications & system maps
│   ├── development/              # Developer guides & SDK references
│   ├── operations/               # Deployment, task scheduler & operational runbooks
│   └── verification/             # Proof-of-execution & verification audit reports
├── platform/
│   ├── artifacts/                # Generated workspace artifact persistence
│   ├── gateway/                  # Central API gateway, HTTP & SSE streaming
│   ├── intelligence/             # Polite domain scope guard & intent router
│   ├── models/                   # Local Ollama model routing (Gemma, Nemotron, Qwen)
│   ├── multimodal/               # Document extraction, PDF, OCR, and vision processing
│   ├── python-compute/           # Python specialized computational engine
│   ├── rag/                      # Air-gapped retrieval-augmented generation & embeddings
│   ├── system/                   # Authoritative hardware detection & metrics provider
│   ├── tools/                    # Tool registry & dynamic sandbox execution
│   ├── visuals/                  # Diagram & chart generation engine (Mermaid, SVG, HTML)
│   ├── voice/                    # Real Indian English Female speech & audio sanitizer
│   ├── web/                      # Single-page Liquid Glass web workbench (HTML/CSS/JS)
│   └── workflow-engine/          # 301 Super AI Agent multi-agent orchestration engine
├── registry/                     # Authoritative 301 agent registry & SIH mapping
├── scripts/                      # Windows Task Scheduler & auto-startup automation
└── tests/                        # Comprehensive 140+ test battery
```

---

## 3. Duplication & Dead Code Audit Findings

1. **Agent Registry**:
   - **Canonical**: `registry/agents.json` (Defines all 301 unique agents 001..301 with display numbers).
   - **Status**: `registry/sih-agent-mapping.json` is synchronized with authoritative 301 agent numbering.
2. **Model Registry**:
   - **Canonical**: `platform/models/model-registry.js` (Defines Gemma 3 27B, Nemotron 3 Nano, Qwen 2.5 Coder).
   - **Status**: Central gateway and model streamer consume this canonical registry.
3. **Workflow Engine**:
   - **Canonical**: `platform/workflow-engine/super-ai-workflow-engine.js`.
   - **Status**: Purged of all hardcoded strings, canned responses, and fallback code templates. Zero fake durations.
4. **Hardware Provider**:
   - **Canonical**: `platform/system/hardware-provider.js`.
   - **Status**: Returns truthful `Ran on NVIDIA RTX 2050` metrics across all gateway responses.
