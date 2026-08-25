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

1. **301 Autonomous Specialist Agents**: Complete `001`..`301` numeric taxonomy covering programming, DevOps, database architecture, legal contracts, engineering standards (API-653, OISD-129), finance, and scientific analysis.
2. **301 Super AI Master Orchestrator**: Automatically decomposes complex multi-stage objectives, dispatches subtasks across specialists, schedules execution on local GPU queues, and synthesizes unified responses.
3. **Image Question Auto-Read + Auto-Answer (Zero Typing / Copying)**: Users can drop a photograph, screenshot, or scan of a question or task. Local PaddleOCR 3.7.0 reads the text, the Symmetrical Task Classifier identifies the objective, routes to the exact specialist (e.g. Email AI Agent 002 for emails, Python AI Agent 101 for code, Study AI Agent 003 for math), executes on local open-weight LLMs, and presents a direct answer ready for 1-click clean copying or offline voice readout.
4. **7 Local Open-Weight Models**: Production stack featuring specialized models for reasoning, code, NLP, enterprise RAG, mathematics, and logic running locally via Ollama.
5. **Local OCR & Document Intelligence Engine**: 100% offline, air-gapped PaddleOCR 3.7.0 / PP-OCRv6 / PP-StructureV3 subsystem with layout analysis, SLANet table extraction, and LaTeX formula recognition on port 8305.
6. **Real-Time Stream Sanitization**: Zero-latency streaming finite state machine that intercepts and suppresses `<think>...</think>` internal reasoning tokens (e.g., DeepSeek-R1 / SmolLM2) and balances markdown code fences while preserving Time-To-First-Token (TTFT).
7. **Pure Real Model Execution**: Zero canned answers, zero static templates, and zero fake durations in production. All specialist outputs are dynamically generated via local Ollama.
8. **Universal Backend Execution Trace**: Every completed response displays truthful hardware execution metrics (`Ran on NVIDIA RTX 2050`), model engine, exact runtime model, air-gap status, and subtask telemetry.
9. **Real Indian English Female Voice**: Sweet, articulate, natural `en-IN` female voice persona (`Microsoft Heera - en-IN`) with conversational humanized sentence pacing and speech sanitization.
10. **Liquid Glass UI & Visual Architecture**: Translucent glassmorphism interface with real-time Mermaid diagrams, SVG charts, and Markdown rendering.
11. **Smart Agent Handoff & Auto-Rerouting (1-Click Specialization Switch)**: When an agent detects a prompt outside its domain (e.g. asking Writing AI Agent 001 to generate a multiple-choice quiz), the system renders a polite Smart Redirect Card with a 1-click `[ Switch to Quiz AI Agent ]` button. Clicking switches the active workspace, updates headers and sidebar, preserves conversation history, and automatically re-executes the original prompt with the target specialist without manual retyping.
12. **Cryptographic Artifact Workspace**: All generated code files (`.cpp`, `.java`, `.py`, `.html`, `.css`, `.js`) are isolated, syntax-validated, and stamped with SHA-256 checksums.

---

## Architecture

```
                                  ┌───────────────────────────────┐
                                  │   USER (Browser / Desktop)   │
                                  └───────────────┬───────────────┘
                                                  │ HTTP / SSE (/api/chat, /api/ocr/analyze-image)
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
                        │  MULTIMODAL ROUTING & TASK CLASSIFIER     │
                        │  platform/multimodal/task-classifier.js   │
                        └─────────────────────┬─────────────────────┘
                                              │
                        ┌─────────────────────┴─────────────────────┐
                        │                                           │
                        ▼                                           ▼
      ┌───────────────────────────────────┐       ┌───────────────────────────────────┐
      │  LOCAL OCR ENGINE (Port 8305)     │       │  RESOURCE SCHEDULER (GPU Mutex)   │
      │  PaddleOCR 3.7.0 / PP-StructureV3 │       │  platform/workflow-engine/        │
      └─────────────────┬─────────────────┘       └─────────────────┬─────────────────┘
                        │                                           │
                        └─────────────────────┬─────────────────────┘
                                              │ Structured Evidence Payload
                                              ▼
                        ┌───────────────────────────────────────────┐
                        │  LOCAL OLLAMA INFERENCE (Port 11434)      │
                        │  7 Open-Weight Models (Nemotron/Qwen/...) │
                        └─────────────────────┬─────────────────────┘
                                              │
                                              ▼
                        ┌───────────────────────────────────────────┐
                        │  STREAM SANITIZER (Finite State Machine)  │
                        │  Suppresses <think> / Buffers Tag Splits  │
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

## Image Question Auto-Read + Auto-Answer Subsystem

The workbench eliminates the tedious need to manually copy or type questions from documents, photos, or screenshots through a seamless **8-step pipeline**:

1. **Image Upload**: Drag-and-drop or paste screenshots/photos (`.png`, `.jpg`, `.jpeg`, `.webp`, `.bmp`).
2. **Offline OCR Ingestion**: Local PaddleOCR 3.7.0 / RapidOCR ONNX compute on port 8305.
3. **Clean Text Extraction**: Layout analysis, table structure parsing, and noise filtering.
4. **Symmetrical Task Classifier**: Exact same classification logic applied to typed queries and visual text.
5. **Specialist AI Agent Routing**: Routes email requests to **Email AI Agent 002**, code requests to **Python AI Agent 101**, math problems to **Study AI Agent 003**, etc.
6. **Local Open-Weight Model Execution**: NVIDIA RTX 2050 inference with single-GPU mutex locks.
7. **Zero-Contamination Response**: Suppresses delimiter tags (`[IMAGE OCR EVIDENCE]`) and outputs pure, high-grade answers.
8. **Clean Copy & Offline Voice Readout**: 1-click clipboard copy and natural Indian English Female TTS speech.

*For complete details, see [Image Question Routing Architecture](docs/architecture/IMAGE-QUESTION-ROUTING.md).*

---

## The 7 Local Open-Weight Models

The workbench deploys a balanced suite of **7 local open-weight models** running locally via Ollama (`http://127.0.0.1:11434`), each matched to its architectural strength:

| # | Model Family | Canonical Tag | Quantization | VRAM Footprint | Context Window | Primary Specialization |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **NVIDIA Nemotron 3 Nano** | `nemotron-3-nano:latest` | 4B Q4_K_M | ~2.8 GB | 4,096 | **Super AI Orchestration & Epistemic Reasoning**<br>Autonomous task decomposition, SOP synthesis, hazard assessments, structured JSON contracts. |
| **2** | **Qwen 2.5 Coder** | `qwen2.5-coder:1.5b` | 1.5B Q4_K_M | ~1.2 GB | 4,096 | **Multi-Language Code Generation & Sandbox Execution**<br>Python, C++, Java, JS, Rust, SQL, AST parsing, SCADA telemetry parsing, script refactoring. |
| **3** | **Google Gemma 3 1B** | `gemma3:1b` | 1B Q4_K_M | ~815 MB | 32,768 | **Edge NLP, Syntactic Parsing & Semantic Synthesis**<br>High-throughput dense transformer, contextual summarization, text rewriting, deductive Q&A. |
| **4** | **Meta Llama 3.2 1B** | `llama3.2:1b` | 1B Q4_K_M | ~1.3 GB | 8,192 | **Fast Lightweight General Text & Low-Latency Assistance**<br>Rapid conversational replies, text rewriting, quick document drafting, latency-critical Q&A. |
| **5** | **IBM Granite 4 1B-H** | `granite4:1b-h` | 1B Q4_K_M | ~1.2 GB | 8,192 | **Enterprise RAG, Entity Extraction & Tool Invocations**<br>Deterministic entity extraction, classification, structured evidence retrieval, enterprise workflows. |
| **6** | **Microsoft Phi-4 Mini** | `phi4-mini` | 3.8B Q4_K_M | ~2.4 GB | 16,384 | **Advanced Reasoning, Mathematics & STEM Logic**<br>Complex algorithmic proofs, formal mathematical deductions, algorithmic planning, long-context logic. |
| **7** | **SmolLM2 1.7B** | `smollm2:1.7b` | 1.5B Q4_K_M | ~1.1 GB | 131,072 | **Lightweight Chain-of-Thought Reasoning & Arithmetic**<br>Step-by-step logic deduction, arithmetic calculations, analytical explanations (with stream sanitization). |

*Complementary Offline Engines:*
- **Local OCR & Document Engine**: `paddleocr-engine` (~62 MB models) · PaddleOCR 3.7.0 / PP-OCRv6 Small / PP-StructureV3 / SLANet tables / LaTeX formulas.
- **Offline Speech-to-Text (STT)**: `tiny.en` (~78 MB RAM) · Faster-Whisper int8 local voice transcription.
- **Offline Text-to-Speech (TTS)**: `Microsoft Heera - en-IN` · Real Indian English Female voice synthesis.

---

## Local OCR & Document Intelligence Engine

Because lightweight open-weight LLMs (like Gemma 3 1B and Llama 3.2 1B) operate strictly on text, the workbench employs a dedicated **Two-Stage Optical Extraction Subsystem** (`platform/ocr/`, `platform/python-compute/` on port 8305):

1. **Stage 1 (Optical Extraction)**:
   - **Document Layout Analysis**: `PP-DocLayout-S` (23-class document block segmentation).
   - **Multi-Script Character Recognition**: `PP-OCRv6 Small` (50 languages + dedicated Tamil `ta_PP-OCRv4_mobile_rec` and Hindi `devanagari_PP-OCRv5_mobile_rec`).
   - **Table Structure Recognition**: `SLANet` extracts grid and borderless tables into structured Markdown and JSON rows.
   - **Formula Recognition**: `PP-FormulaNet-S` converts mathematical expressions directly to LaTeX notation.
   - **Native PDF & Metadata Scrubbing**: PyMuPDF rasterization with automatic filtering of XMP, C2PA, and PDF dictionary noise.
2. **Stage 2 (Local LLM Reasoning)**:
   - The structured character, table, and bounding box evidence is injected into the local LLM context (e.g., Nemotron 3 Nano, Granite 4 1B-H, or Qwen 2.5 Coder) for synthesis and verification.

*For complete architectural specifications, see [OCR Document Engine](docs/architecture/OCR-DOCUMENT-ENGINE.md).*

---

## Real-Time Stream Sanitization

The platform includes a zero-latency streaming finite state machine (`StreamSanitizer` in `platform/models/stream-sanitizer.js`):

- **Reasoning Token Suppression**: Automatically intercepts and strips `<think>...</think>`, `<reasoning>...</reasoning>`, `[THINK]...[/THINK]`, and `[REASONING]...[/REASONING]` blocks from models like SmolLM2 1.7B before tokens reach the browser.
- **Chunk-Boundary Split Recovery**: Employs lookahead prefix buffering so tags split across arbitrary streaming chunks (e.g., `["<th", "ink>", "...", "</", "think>"]`) are cleanly caught and removed without leaking raw markup.
- **False Start Recovery**: Text resembling tag prefixes (e.g., `"I think about..."`) is safely flushed without losing legitimate user content.
- **Speech & Visual Sanitization**: Companion sanitizers (`platform/voice/speech-sanitizer.js` and `platform/visuals/sanitizer.js`) clean formatting, unclosed code fences, and symbols before audio synthesis or SVG/Mermaid diagram rendering.

*For complete architectural specifications, see [Stream Sanitization](docs/architecture/STREAM-SANITIZATION.md).*

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

## Hardware Profile

- **Target System**: Local Windows 11 Pro PC
- **GPU**: NVIDIA GeForce RTX 2050 (4GB GDDR6 VRAM, CUDA 12.5)
- **Concurrency Policy**: Single GPU execution lock (`MAX_GPU_CONCURRENCY = 1`)
- **Memory Footprint**: Strictly constrained within 4GB VRAM limit
- **Session Affinity**: 5-minute warm model residency to prevent reloading thrash

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
├── gateway/              # Central HTTP & SSE Gateway server (Port 8300)
├── workflow-engine/      # 301 Super AI Agent Master Orchestration Engine
├── intelligence/         # Domain Scope Guard, Intent Router & Routing Registry
├── models/               # Model Registry, Stream Sanitizer & Ollama Streamer
├── multimodal/           # Universal Document Extractor & Attachment Integrity
├── ocr/                  # Python OCR & Document Intelligence Engine (Port 8305)
├── python-compute/       # Specialized Python Compute Engine & Data Analytics
├── rag/                  # Local Vector Indexing & Hybrid BM25 Evidence Retrieval
├── system/               # Truthful Hardware Provider & System Metrics
├── tools/                # Tool Sandbox & Registry
├── visuals/              # Diagram & Chart Generator (Mermaid/SVG Sanitizer)
├── voice/                # Real Indian English Female Speech Engine (STT/TTS)
└── web/                  # Liquid Glass Single-Page Application (HTML/CSS/JS)

registry/
├── agents.json           # 301 Canonical Agent Definitions (001–301)
└── sih-agent-mapping.json# SIH Problem Mapping & Numeric Routing

tests/
├── runtime/              # Server, gateway, and no-default-response tests
├── workflow/             # Multi-agent orchestration & provenance tests
├── agents/               # Registry numbering, scope guard, and trace tests
├── models/               # 7-model registry, stream sanitizer & routing tests
├── multimodal/           # Document extractor, PDF & attachment integrity tests
├── ui/                   # Liquid Glass UI, composer, model selector tests
├── voice/                # Indian English Female speech tests
└── python-compute/       # Python compute & document extraction tests

docs/
├── architecture/         # System specifications (Stream Sanitization, OCR, Routing)
├── development/          # Developer guides & SDK contracts
├── operations/           # Deployment & background runtime runbooks
└── verification/         # Proof-of-execution & audit reports
```

---

## Key Architecture Documentation

- [Image Question Auto-Read & Routing Architecture](docs/architecture/IMAGE-QUESTION-ROUTING.md)
- [OCR & Document Intelligence Engine Specification](docs/architecture/OCR-DOCUMENT-ENGINE.md)
- [Multimodal Routing & Model Selection Specification](docs/architecture/MULTIMODAL-ROUTING.md)
- [Stream Sanitization Specification](docs/architecture/STREAM-SANITIZATION.md)
- [Production Model Stack Architecture](docs/architecture/MODEL-ARCHITECTURE.md)
- [Sovereign Hybrid RAG Architecture](docs/architecture/RAG-ARCHITECTURE.md)

---

## Testing

Run the complete 147-test regression battery:
```bash
# Run all core test suites
node --test tests/runtime/*.test.js tests/agents/*.test.js tests/workflow/*.test.js tests/ui/*.test.js tests/python-compute/*.test.js tests/voice/*.test.js tests/models/*.test.js tests/multimodal/*.test.js

# Run SIH UI validation suite
node tests/sih/run-all-tests.js
```

---

## GitHub Publication

- **Repository**: `reginaldalfret/100-AI-Agents`
- **Branch**: `feature/codebase-architecture-refactor`
