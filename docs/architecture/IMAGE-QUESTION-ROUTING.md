# Image Question Auto-Read + Auto-Answer Pipeline Architecture

> **Subsystem**: Universal Multimodal Image Question Ingestion & Specialist Agent Routing  
> **Source Modules**: `platform/multimodal/image-question-pipeline.js`, `platform/multimodal/task-classifier.js`, `platform/multimodal/ocr-engine.js`, `platform/gateway/src/server.js`  
> **OCR Engine**: PaddleOCR 3.7.0 · PP-OCRv6 Small · PP-StructureV3 · RapidOCR ONNX (Port 8305)  
> **Hardware Target**: NVIDIA GeForce RTX 2050 (4GB VRAM) · Local CPU OpenMP · Windows 11  
> **Air-Gap Guarantee**: 100% On-Premise Execution · 0 External Network Calls · Zero Cloud Egress  
> **Status**: Production

---

## 1. Executive Summary

The Sovereign AI Workbench features an end-to-end **Image Question Auto-Read + Auto-Answer System**. Users can upload, paste, or drag-and-drop photographs, scanned forms, whiteboard notes, code snippets, mathematical equations, or screenshots of problem statements without typing or copying a single word.

The system automatically:
1. Performs local, air-gapped optical character recognition (OCR) via **PaddleOCR 3.7.0** on port 8305.
2. Extracts high-fidelity text, layout blocks, tables, and mathematical formulas.
3. Classifies the query with 100% functional symmetry to typed text.
4. Routes the task to the exact canonical specialist AI agent (e.g., **Email AI Agent 002**, **Python AI Agent 101**, **Study AI Agent 003**).
5. Executes on the optimal local open-weight model (e.g., NVIDIA Nemotron 3, Qwen 2.5 Coder, Microsoft Phi-4 Mini).
6. Delivers a zero-contamination direct answer ready for one-click clean copying or offline Text-to-Speech (TTS) voice playback.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                8-STEP IMAGE-TO-ANSWER PIPELINE                                   │
│                                                                                                  │
│ [1. Image Upload] ──> [2. Local PaddleOCR] ──> [3. Clean Text Extraction] ──> [4. Classifier]   │
│         │                                                                             │          │
│         ▼                                                                             ▼          │
│ [8. Clean Copy / TTS] <── [7. Zero-Contam Response] <── [6. Local LLM] <── [5. Specialist Agent]│
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. The 8-Step Optical-to-Answer Pipeline

```mermaid
flowchart TD
    subgraph Step 1: Ingestion
        A[User Uploads Image / Screenshot / Scan] --> B[Attachment Integrity Validation]
    end

    subgraph Step 2 & 3: Local Vision Compute (Port 8305)
        B --> C[Local PaddleOCR 3.7.0 Engine]
        C --> D[PP-DocLayout-S + PP-OCRv6 + SLANet]
        D --> E[Clean Text Extraction & Bounding Normalization]
    end

    subgraph Step 4 & 5: Symmetrical Intent & Routing
        E --> F[Universal Task & Agent Classifier]
        F --> G{Specialist Agent Dispatch}
        G -->|Email Drafting Request| Ag2[Agent 002: Email AI Agent]
        G -->|Python / Script Request| Ag101[Agent 101: Python AsyncIO AI Agent]
        G -->|Math / Logic Problem| Ag3[Agent 003: Study AI Agent]
        G -->|Code Implementation| Ag61[Agent 061: Code Generation AI Agent]
        G -->|Summary / NLP Task| Ag5[Agent 005: Summarization AI Agent]
    end

    subgraph Step 6: GPU Execution Lock
        Ag2 & Ag101 & Ag3 & Ag61 & Ag5 --> H[Local Ollama Model Execution<br/>Nemotron 3 / Qwen 2.5 / Phi-4 / Granite 4]
    end

    subgraph Step 7 & 8: Delivery & Voice
        H --> I[Stream Sanitizer & Zero-Contamination Delivery]
        I --> J[Clean Markdown Response]
        I --> K[One-Click Copy & Offline en-IN TTS Audio]
    end
```

### Detailed Breakdown of Each Step

| Step | Stage Name | Technical Implementation | Responsibilities & Output |
| :---: | :--- | :--- | :--- |
| **1** | **Image Upload** | `platform/gateway/src/server.js`, `platform/multimodal/attachment-integrity.js` | Ingestion of `.png`, `.jpg`, `.jpeg`, `.webp`, `.bmp`, `.tiff`. Magic byte header validation, base64 payload decoding, file integrity checks. |
| **2** | **Offline OCR** | `platform/ocr/` (FastAPI/Uvicorn on `127.0.0.1:8305`), `PP-OCRv6 Small` | DBNet++ text region detection, SVTR-LCNet text recognition, and MobileNetV2 orientation correction. Sub-second CPU/CUDA inference. |
| **3** | **Clean Text Extraction** | `platform/multimodal/ocr-engine.js` | Normalizes character streams, strips metadata/XMP artifacts, calculates mean confidence score (0.00–1.00), structures blocks & tables. |
| **4** | **Question/Task Classifier** | `platform/multimodal/task-classifier.js` | Parses extracted natural language against canonical task regexes and semantic rules (identifies question intent, programming syntax, equations). |
| **5** | **Specialist Agent Routing** | `registry/agents.json`, `platform/multimodal/image-question-pipeline.js` | Dynamically binds task to the authoritative specialist (e.g., `agent-002`, `agent-101`, `agent-003`) and targets optimal LLM engine. |
| **6** | **Local Model Execution** | `platform/models/model-streamer.js`, Ollama (`127.0.0.1:11434`) | Formulates grounded prompt with `[IMAGE OCR EVIDENCE]`, acquires GPU Mutex Lock, executes inference on RTX 2050 (4GB VRAM). |
| **7** | **Zero-Contamination Response** | `platform/models/stream-sanitizer.js` | Strips internal `<think>` tokens, removes evidence boundary tags from user text, outputs direct, authoritative solution. |
| **8** | **Clean Copy / TTS** | `platform/voice/offline-tts.js`, Liquid Glass UI | Renders formatted markdown, enables 1-click clipboard copy, triggers offline `Microsoft Heera - en-IN` speech synthesis. |

---

## 3. Typed vs. Image Query Symmetry

A core design principle of the Sovereign AI Workbench is **Complete Semantic Symmetry**:

> [!IMPORTANT]
> **Input Symmetry Axiom**: Whether a user types an instruction manually into the prompt composer or uploads a high-resolution screenshot containing that same text, the platform must classify the exact same intent, route to the exact same canonical specialist agent, invoke the exact same local model, and enforce the exact same domain scope guards.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SYMMETRICAL ROUTING ENGINE                      │
├──────────────────────────────────┬─────────────────────────────────────┤
│ TYPED INPUT                      │ IMAGE OCR INPUT                     │
│ "Write a professional email      │ [Screenshot of manager request]     │
│  to my manager requesting a      │               │                     │
│  project review"                 │               ▼ (PaddleOCR 3.7.0)   │
│                                  │ "Write a professional email         │
│                                  │  to my manager requesting a         │
│                                  │  project review"                    │
├──────────────────────────────────┴─────────────────────────────────────┤
│                                  ▼                                     │
│                task-classifier.js: classifyTaskAndAgent()              │
│                                  │                                     │
│  ├── Task Type:         EMAIL_WRITING                                  │
│  ├── Target Agent:      Agent 002 (Email AI Agent)                     │
│  ├── Target Domain:     Writing & Communication                        │
│  ├── Canonical Model:   nemotron-3-nano:latest (NVIDIA Nemotron 3)     │
│  └── Scope Guard:       PASSED                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Symmetrical Routing Decision Matrix

| OCR Extracted / Typed Text Pattern | Task Classification | Dispatched AI Specialist | Canonical Model Engine |
| :--- | :--- | :--- | :--- |
| `"Write a professional email requesting project review"` | `EMAIL_WRITING` | **Email AI Agent (Agent 002)** | `nemotron-3-nano:latest` |
| `"Write a palindrome program in Python with asyncio"` | `PYTHON_PROGRAMMING` | **Python AsyncIO AI Agent (Agent 101)** | `qwen2.5-coder:1.5b` |
| `"Solve: 17 × 28 and show step-by-step reasoning"` | `MATHEMATICS_LOGIC` | **Study AI Agent (Agent 003)** | `phi4-mini` |
| `"Solve algebraic equation: 2x + 5 = 15"` | `MATHEMATICS_LOGIC` | **Study AI Agent (Agent 003)** | `phi4-mini` |
| `"Create a REST API with React components and Go"` | `CODE_GENERATION` | **Code Generation AI Agent (Agent 061)** | `qwen2.5-coder:1.5b` |
| `"Summarize these findings into 3 concise bullet points"` | `SUMMARIZATION` | **Summarization AI Agent (Agent 005)** | `smollm2:1.7b` |
| `"Proofread and rewrite this paragraph for clarity"` | `GRAMMAR_REWRITE` | **Grammar AI Agent (Agent 006)** | `smollm2:1.7b` |
| `"Extract inspection table and wall thickness data"` | `DOCUMENT_ANALYSIS` | **PDF Processing AI Agent (Agent 045)** | `granite4:1b-h` |

---

## 4. Evidence Grounding Protocol (`[IMAGE OCR EVIDENCE]`)

To guarantee strict epistemic truthfulness and prevent generative hallucinations, the pipeline encapsulates optical extractions in a canonical evidence boundary before prompting the local model:

### Evidence Block Structure

```text
[IMAGE OCR EVIDENCE]
Source: manager-review-request.png
Extracted Text: Write a professional email to my manager requesting a project review for the Q3 automation deliverables.
OCR Confidence: 0.96
[/IMAGE OCR EVIDENCE]

Please fulfill the above request: Write a professional email to my manager requesting a project review for the Q3 automation deliverables.
```

### Grounding Rules & Anti-Leakage Controls

1. **Deterministic Context Injection**: Downstream LLMs are instructed that all facts within `[IMAGE OCR EVIDENCE]...[/IMAGE OCR EVIDENCE]` are immutable ground truth extracted from the user's uploaded artifact.
2. **Zero-Contamination Response Formatting**: The response generation pipeline and `StreamSanitizer` guarantee that raw delimiter tags (`[IMAGE OCR EVIDENCE]`, `[/IMAGE OCR EVIDENCE]`, internal confidence scores, and token counters) are **never reflected back to the user interface**.
3. **Purity of Output**: The final response presented to the user contains only the clean, high-grade deliverable (e.g., the finalized email draft, the runnable Python script, or the step-by-step arithmetic solution).

---

## 5. End-to-End Walkthrough: Image Email Request

### Step 1: User Drops Image
The user drags `manager-email.png` into the Liquid Glass UI. The prompt text input remains completely blank.

### Step 2: Gateway Ingestion & OCR
`platform/gateway/src/server.js` detects the image attachment and forwards it to `ImageQuestionPipeline.processImageQuestion()`:
```javascript
const ocrResult = await processDocumentOCR(attachmentOrPath, options);
// Extracted: "Draft an email to my manager asking for feedback on the Q3 automation deliverables."
// Confidence: 0.97 (HIGH)
```

### Step 3: Symmetrical Classification
`classifyTaskAndAgent()` matches the regex `/\b(?:write|draft|compose)\s+(?:a\s+|an\s+)?email\b/i`:
```json
{
  "taskType": "EMAIL_WRITING",
  "taskLabel": "Email Writing",
  "agentId": "agent-002",
  "agentNumber": "002",
  "agentName": "Email AI Agent",
  "domain": "Writing & Communication",
  "recommendedModel": "nemotron-3-nano:latest"
}
```

### Step 4: Model Execution
The Gateway dispatches the request to local Ollama with `nemotron-3-nano:latest` under GPU mutex locking.

### Step 5: Backend Execution Trace
The response includes complete cryptographic and hardware provenance:
```json
{
  "attachmentReceived": "manager-email.png",
  "inputType": "Image",
  "ocrEngine": "PaddleOCR 3.7.0 (PP-OCRv6 + PP-StructureV3)",
  "ocrResult": "Draft an email to my manager asking for feedback on the Q3 automation deliverables.",
  "taskClassification": "Email Writing",
  "agentDispatched": "Email AI Agent (Agent 002)",
  "modelEngine": "nemotron-3-nano:latest",
  "hardware": "NVIDIA RTX 2050",
  "externalCalls": 0,
  "is_air_gapped": true,
  "elapsedMs": 1420
}
```

### Step 6: User Deliverable & Voice Readout
The UI renders a formatted email with Subject Line, Body, and Call to Action. Clicking the **Audio** icon triggers the local Indian English Female voice synthesis (`Microsoft Heera - en-IN`) to read the email aloud with zero network egress.

---

## 6. Zero-Cloud Air-Gap & Security Guarantees

```
┌────────────────────────────────────────────────────────────────────────┐
│                     AIR-GAP ISOLATION BOUNDARY                         │
│                                                                        │
│  ┌────────────────────┐   127.0.0.1:8305   ┌──────────────────────┐   │
│  │ Gateway Server     │ ─────────────────> │ PaddleOCR 3.7.0      │   │
│  │ (Node.js Port 8300)│ <───────────────── │ (FastAPI / RapidOCR) │   │
│  └─────────┬──────────┘                    └──────────────────────┘   │
│            │                                                          │
│            │ 127.0.0.1:11434               ┌──────────────────────┐   │
│            └─────────────────────────────> │ Ollama Local Runtime │   │
│              Local HTTP / IPC              │ (RTX 2050 4GB VRAM)  │   │
│                                            └──────────────────────┘   │
│                                                                        │
│  [X] ZERO Cloud Egress    [X] ZERO External APIs   [X] ZERO Telemetry  │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Zero External Sockets**: All inter-service communications (Node.js Gateway $\leftrightarrow$ Python OCR Engine $\leftrightarrow$ Ollama LLM $\leftrightarrow$ Windows Speech Synthesis) are bound strictly to `127.0.0.1` and local IPC.
2. **Ephemeral Memory Lifecycle**: Uploaded image buffers and intermediate raster bitmaps are retained strictly in transient memory and deleted from temporary directories immediately upon feature extraction.
3. **No Image Data Persistence in Chat Logs**: Only the extracted text and structured evidence payload are preserved in local conversation history (`platform/context/`), preventing unmanaged disk bloat.
4. **C2PA / Exif Scrubbing**: Embedded image metadata (GPS coordinates, camera serials, author names) is stripped prior to language model prompting to maintain operational security.

---

## 7. Verification & Automated Test Coverage

The image question auto-routing subsystem is verified by dedicated automated test suites in `tests/multimodal/`:

- `tests/multimodal/image-question-routing.test.js`: Validates symmetrical task classification across all 8 domain patterns.
- `tests/multimodal/image-email-request.test.js`: End-to-end test validating image upload $\rightarrow$ OCR extraction $\rightarrow$ Agent 002 routing $\rightarrow$ trace payload.
- `tests/multimodal/image-code-request.test.js`: Validates Python/C++ code request extraction $\rightarrow$ Agent 101/061 routing.
- `tests/multimodal/image-math-request.test.js`: Validates mathematical formula extraction $\rightarrow$ Agent 003 (`phi4-mini`) routing.
- `tests/multimodal/attachment-integrity.test.js`: Validates base64 decoding, MIME magic byte verification, and corrupt payload rejection.
