# 301 Super AI Agents — Sovereign AI Workbench

[![SIH 26117](https://img.shields.io/badge/SIH%20Problem-26117-blue.svg)](https://smartindiahackathon.gov.in)
[![Hardware](https://img.shields.io/badge/Hardware-NVIDIA%20RTX%202050%20(4GB)-76B900.svg)](https://www.nvidia.com)
[![Air-Gapped](https://img.shields.io/badge/Air--Gap-100%25%20Local%20Inference-green.svg)](#air-gapped-architecture)
[![Agents](https://img.shields.io/badge/Agents-301%20Autonomous%20Specialists-purple.svg)](#301-agent-workforce)
[![Test Battery](https://img.shields.io/badge/Tests-147%2F147%20Passing%20(100%25)-brightgreen.svg)](#testing)

---

## What It Is

**301 Super AI Agents** is an enterprise-grade, air-gapped, sovereign AI workbench designed for confidential industrial, engineering, and enterprise operations. It integrates a fleet of **301 autonomous specialist AI agents** orchestrated by a master coordinator (**301 Super AI Agent**) running entirely on local consumer hardware without sending a single byte to external cloud APIs.

---

## SIH 26117

Developed to solve **Smart India Hackathon Problem Statement 26117**:
> *"Sovereign On-Premise Agentic AI Workbench using Open-Weight Multimodal LLMs for Confidential Industrial Work."*

### Core Challenge Solved:
Enterprises operating in oil & gas, defense, power grids, manufacturing, and critical infrastructure cannot expose proprietary blueprints, P&ID schematics, API designs, or confidential meeting transcripts to public LLM APIs. **301 Super AI Agents** provides an on-premise, secure, private multi-agent AI workforce with cryptographic audit trails, localized Python compute, and zero external network dependencies.

---

## Key Features

1. **301 Autonomous Specialist Agents**: Complete 001..301 numeric taxonomy covering programming, DevOps, database architecture, legal contracts, engineering standards (API-653, OISD-129), finance, and scientific analysis.
2. **301 Super AI Master Orchestrator**: Automatically decomposes complex multi-stage objectives, dispatches subtasks across specialists, schedules execution on local GPU queues, and synthesizes unified responses.
3. **Pure Real Model Execution**: Zero canned answers, zero static templates, and zero fake durations in production. All specialist outputs are dynamically generated via local Ollama.
4. **Universal Backend Execution Trace**: Every completed response displays truthful hardware execution metrics (`Ran on NVIDIA RTX 2050`), model engine, exact runtime model, air-gap status, and subtask telemetry.
5. **Real Indian English Female Voice**: Sweet, articulate, natural `en-IN` female voice persona with conversational humanized sentence pacing and speech sanitization.
6. **Liquid Glass UI & Visual Architecture**: Translucent glassmorphism interface with real-time Mermaid diagrams, SVG charts, and Markdown rendering.
7. **Cryptographic Artifact Workspace**: All generated code files (`.cpp`, `.java`, `.py`, `.html`, `.css`, `.js`) are isolated, syntax-validated, and stamped with SHA-256 checksums.

---

## Architecture

```
                                  ┌───────────────────────────────┐
                                  │   USER (Browser / Desktop)   │
                                  └───────────────┬───────────────┘
                                                  │ HTTP / SSE (/api/chat)
                                                  ▼
                        ┌───────────────────────────────────────────────────┐
                        │      CENTRAL GATEWAY (Port 8300)                  │
                        │      platform/gateway/src/server.js               │
                        └─────────┬───────────────────────────────┬─────────┘
                                  │                               │
            Single Specialist     │                               │ Multi-Agent Workflow
            Direct Execution      │                               │
                                  ▼                               ▼
      ┌───────────────────────────────────────┐ ┌───────────────────────────────────────┐
      │ SPECIALIST AGENT (001–300)            │ │ 301 SUPER AI AGENT                    │
      │ agents/agent-XXX/                     │ │ platform/workflow-engine/             │
      └───────────────────┬───────────────────┘ └───────────────────┬───────────────────┘
                          │                                         │ Plan -> Decompose
                          │                                         ▼
                          │                     ┌───────────────────────────────────────┐
                          │                     │ SPECIALIST SUBTASK DISPATCH           │
                          │                     │ (C++, Java, Python / HTML, CSS, JS)   │
                          │                     └───────────────────┬───────────────────┘
                          │                                         │
                          └───────────────────┬─────────────────────┘
                                              │
                                              ▼
                        ┌───────────────────────────────────────────┐
                        │  RESOURCE SCHEDULER (Single GPU Mutex)    │
                        │  platform/workflow-engine/resource-sched  │
                        └─────────────────────┬─────────────────────┘
                                              │
                                              ▼
                        ┌───────────────────────────────────────────┐
                        │  LOCAL OLLAMA INFERENCE (Port 11434)      │
                        │  Nemotron 3 / Qwen 2.5 Coder / Gemma 4 E2B│
                        └─────────────────────┬─────────────────────┘
                                              │
                                              ▼
                        ┌───────────────────────────────────────────┐
                        │  WORKFLOW RESULT VALIDATOR & ARTIFACTS    │
                        │  AST Validation + SHA-256 Provenance      │
                        └─────────────────────┬─────────────────────┘
                                              │
                                              ▼
                        ┌───────────────────────────────────────────┐
                        │  301 SUPER AI SYNTHESIS & BACKEND TRACE   │
                        │  Universal Hardware Info + Multi-Code     │
                        └─────────────────────┬─────────────────────┘
                                              │
                                              ▼
                        ┌───────────────────────────────────────────┐
                        │  LIQUID GLASS WORKBENCH UI                │
                        │  Real-Time SSE Event Render + Voice Audio │
                        └───────────────────────────────────────────┘
```

---

## 301 Agent Workforce

The platform features **301 distinct specialist agents**, indexed from `001` through `301`:

- **001–005**: Writing AI Agent, Email AI Agent, Study AI Agent, Quiz AI Agent, Flashcard AI Agent.
- **006–060**: Full-Stack Web, DevOps, Cloud Infrastructure, Database Design, System Security.
- **061–100**: Code Generation, Testing & QA, Data Science, Spreadsheets, OCR & Document Processing.
- **101–150**: Language Specialists (Python AsyncIO, Java JVM, C Memory, C++ Template, Go Concurrency, Rust Ownership, JavaScript Runtime, TypeScript).
- **151–200**: Frontend Architecture, CSS Styling, React Components, UI Design, PostgreSQL Performance.
- **201–300**: Industrial Engineering, API-653 Tank Inspection, OISD-129 Safety, Corrosion Analytics, SCADA/P&ID.
- **301**: **301 Super AI Agent** (*Master Orchestrator*).

---

## Super AI Agent Workflow

When given complex instructions (e.g., *"Write a palindrome program in C++, Java, Python"* or *"Design an E-Commerce website in HTML, CSS, JavaScript"*), the Master Orchestrator triggers an automated 7-stage workflow:

1. **Intent Decomposition**: Identifies required technical capabilities and workflow dependencies.
2. **Canonical Specialist Discovery**: Resolves the exact expert agents from the 301-agent registry.
3. **Handoff Contract Generation**: Formulates structured, self-contained subtask contracts.
4. **GPU Mutex Scheduling**: Dispatches subtasks sequentially across the local GPU queue to guarantee 0% OOM risk on 4GB VRAM.
5. **Real Model Execution**: Queries local Ollama dynamically without static templates.
6. **Artifact Validation & Provenance**: Inspects code syntax and records cryptographic SHA-256 hashes.
7. **Architectural Synthesis**: Unifies all specialist outputs with comparison tables and execution traces.

---

## Local Models

| Model Family | Canonical Tag | VRAM Footprint | Primary Specialization |
| :--- | :--- | :--- | :--- |
| **NVIDIA Nemotron 3 Nano** | `nemotron-3-nano:latest` | ~2.8 GB | Super AI orchestration, multi-agent decomposition, deep reasoning |
| **Qwen 2.5 Coder** | `qwen2.5-coder:1.5b` | ~1.2 GB | Multi-language code generation, refactoring, deterministic sandbox |
| **Google Gemma 4 E2B** | `gemma4:e2b` | ~2.4 GB | Lightweight multimodal reasoning, visual anomaly detection, evidence synthesis |
| **Meta Llama 3.2 1B** | `llama3.2:1b` | ~1.3 GB | Fast lightweight general text, quick summaries, low-latency assistance |
| **IBM Granite 4 1B-H** | `granite4:1b-h` | ~1.2 GB | Enterprise RAG, structured extraction, classification & tool calling |
| **Microsoft Phi-4 Mini** | `phi4-mini` | ~2.4 GB | Advanced reasoning, mathematics, logic, algorithmic problem solving |
| **OCR & Document Intelligence** | `python-compute-ocr` | CPU / RAM | Primary Image/PDF character & table extraction |
| **Faster-Whisper Tiny** | `tiny.en` | ~78 MB | 100% Offline Speech-to-Text (Voice Input) |

---

## Hardware Profile

- **Target System**: Local Windows 11 Pro PC
- **GPU**: NVIDIA GeForce RTX 2050 (4GB GDDR6 VRAM, CUDA 12.5)
- **Concurrency Policy**: Single GPU execution lock (Queue concurrency = 1)
- **Memory Footprint**: Strictly constrained within 4GB VRAM limit

---

## Offline Voice (Speech-to-Text & Text-to-Speech)

- **Voice Input (STT)**: 100% offline local speech recognition running on local CPU with 0 external network requests. Audio captured via browser `MediaRecorder` is transcribed locally and placed into the composer.
- **Voice Output (TTS)**: 100% offline Indian English Female speech synthesis (`Microsoft Heera - en-IN`) streaming standard uncompressed WAV audio locally to the browser.
- **Privacy & Air-Gap**: 0 telemetry, 0 cloud dependencies, 0 permanent microphone audio retention. Transient audio is purged immediately upon transcription.

---

## Quick Start

### 1. Prerequisites
- **Node.js**: v20.x or higher
- **Ollama**: Installed with `qwen2.5-coder:1.5b` or `nemotron-3-nano:latest`
- **NVIDIA GPU**: RTX 2050 / 3050 / 4050 or compatible CUDA device

### 2. Start the Gateway Server
```bash
node platform/gateway/src/server.js
```

### 3. Open the Workbench
Open your browser and navigate to:
```
http://127.0.0.1:8300/
```

---

## Project Structure

```
platform/
├── gateway/              # Central HTTP & SSE Gateway server
├── workflow-engine/      # 301 Super AI Agent Master Orchestration Engine
├── intelligence/         # Domain Scope Guard & Intent Router
├── models/               # Model Registry & Ollama Streamer
├── multimodal/           # Document & Image Processing Subsystem
├── python-compute/       # Specialized Python Compute Engine
├── rag/                  # Local Vector Indexing & Evidence Retrieval
├── system/               # Truthful Hardware Provider & System Metrics
├── tools/                # Tool Sandbox & Registry
├── visuals/              # Diagram & Chart Generator (Mermaid/SVG)
├── voice/                # Real Indian English Female Speech Engine
└── web/                  # Liquid Glass Single-Page Application (HTML/CSS/JS)

registry/
├── agents.json           # 301 Canonical Agent Definitions (001–301)
└── sih-agent-mapping.json# SIH Problem Mapping & Numeric Routing

tests/
├── runtime/              # Server, gateway, and no-default-response tests
├── workflow/             # 26 multi-agent orchestration & provenance tests
├── agents/               # Registry numbering, scope guard, and trace tests
├── ui/                   # Liquid Glass UI, composer, model selector tests
├── voice/                # Indian English Female speech tests
└── python-compute/       # Python compute & document extraction tests

docs/
├── architecture/         # System specifications & architecture maps
├── development/          # Developer guides & SDK contracts
├── operations/           # Deployment & background runtime runbooks
└── verification/         # Proof-of-execution & audit reports
```

---

## Testing

Run the complete 147-test regression battery:
```bash
# Run all core test suites
node --test tests/runtime/*.test.js tests/agents/*.test.js tests/workflow/*.test.js tests/ui/*.test.js tests/python-compute/*.test.js tests/voice/*.test.js

# Run SIH UI validation suite
node tests/sih/run-all-tests.js
```

---

## GitHub Publication

- **Repository**: `reginaldalfret/100-AI-Agents`
- **Branch**: `feature/codebase-architecture-refactor`
