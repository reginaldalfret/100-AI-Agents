# OCR & Document Intelligence Engine Architecture

> **Engine**: PaddleOCR 3.7.0 · PP-OCRv6 Small · PP-StructureV3 · RapidOCR ONNX  
> **Python Compute**: `platform/ocr/`, `platform/python-compute/` (Port 8305)  
> **Node.js Client**: `platform/multimodal/ocr-engine.js`, `platform/multimodal/image-question-pipeline.js`, `platform/multimodal/document-extractor.js`  
> **Gateway Endpoints**: `/api/ocr/analyze-image`, `/api/attachments/extract`, `/api/ocr` (Port 8300)  
> **Mode**: 100% Offline · Air-Gapped · CPU-Primary with Dynamic CUDA Acceleration  
> **Status**: Production

---

## 1. Architecture Overview

The Sovereign AI Workbench incorporates a dedicated, high-throughput on-premise Document Intelligence & OCR Engine designed for industrial schematics, scanned refinery inspection reports, NDT ultrasonic logs, tax invoices, academic papers, multi-page technical PDFs, and photographic question prompts.

Because lightweight on-device LLMs (such as Google Gemma 3 1B and Meta Llama 3.2 1B) operate strictly in text mode, optical character recognition and document layout decomposition are handled prior to language model reasoning by this specialized vision subsystem.

```
INPUT (Scanned PDF / P&ID Drawing / Photograph / Invoice / Form / Screenshot)
  │
  ▼
Local Preprocessing & Normalization (Orientation Correction, Deskew, Denoise, CLAHE)
  │
  ▼
PP-DocLayout-S (23-Class Document Layout & Structural Block Segmentation)
  │
  ├────── Text Regions ────────> PP-OCRv6 Small (50 Languages + Tamil + Hindi)
  │                                    │
  ├────── Table Regions ───────> SLANet (Table Structure → HTML / Markdown / JSON)
  │                                    │
  └────── Formula Regions ─────> PP-FormulaNet-S (Math Expressions → LaTeX)
                                       │
                                       ▼
Topological Reading Order Reconstruction & Spatial Bounding Box Alignment
  │
  ▼
Canonical Structured Document Payload (JSON Schema / Markdown Tables / Citations)
  │
  ▼
Local LLM Reasoning & Synthesis (Nemotron 3 / Granite 4 / Qwen 2.5 / Gemma 3 / Phi-4 / SmolLM2)
```

---

## 2. Model Inventory & Local Weight Manifest

All model weights are pre-bundled in the local application package with cryptographic SHA-256 verification at startup. **Zero runtime downloads or external network connections are permitted.**

| Model Component | Architecture / Purpose | Size | Execution Target | Language Scope |
| :--- | :--- | :--- | :--- | :--- |
| **PP-OCRv6 Small Det** | DBNet++ Text Region Detection | 9.6 MB | CPU / CUDA | Universal |
| **PP-OCRv6 Small Rec** | SVTR-LCNet Multi-Script Recognition | 14.5 MB | CPU / CUDA | 50 Latin & Common Scripts |
| **Text Orientation Cls** | MobileNetV2 0° / 180° Angle Classifier | 1.4 MB | CPU | Universal |
| **PP-DocLayout-S** | YOLO-based 23-Class Document Layout | 15.0 MB | CPU / CUDA | Universal Document Layouts |
| **SLANet** | Spatial Layout Attention Table Recognizer | 9.0 MB | CPU / CUDA | Universal Grid & Borderless Tables |
| **PP-FormulaNet-S** | Mathematical Expression to LaTeX | 12.0 MB | CPU / CUDA | Math & Scientific Notation |
| **Tamil Recognition** | `ta_PP-OCRv4_mobile_rec` (Dedicated) | 4.8 MB | CPU | Tamil Script |
| **Hindi Recognition** | `devanagari_PP-OCRv5_mobile_rec` (Dedicated) | 5.2 MB | CPU | Devanagari / Hindi Script |

- **Total Required Footprint**: ~49.5 MB
- **Total Footprint with Multi-Script Extensions**: ~71.5 MB

```
platform/ocr/models/
├── detection/PP-OCRv6_det_small/
├── recognition/PP-OCRv6_rec_small/
├── classification/ch_ppocr_mobile_v2.0_cls/
├── layout/PP-DocLayout-S/
├── table/SLANet/
├── formula/PP-FormulaNet-S/
├── languages/
│   ├── ta_PP-OCRv4_mobile_rec/
│   └── devanagari_PP-OCRv5_mobile_rec/
└── manifest.json
```

---

## 3. Two-Stage OCR → LLM Integration Pipeline

The workbench enforces a strict separation between **optical sensory perception** (Stage 1) and **epistemic reasoning** (Stage 2):

```mermaid
flowchart TD
    subgraph Stage 1: Optical Extraction Subsystem
        A[Visual Input: PDF / Drawing / Image] --> B[Preprocessing: Denoise & Deskew]
        B --> C[PP-DocLayout-S: Layout Analysis]
        C --> D[PP-OCRv6: Multi-Script Text OCR]
        C --> E[SLANet: Tabular Data Extraction]
        C --> F[PP-FormulaNet: LaTeX Extraction]
        D & E & F --> G[Structured Evidence JSON + Markdown Tables]
    end

    subgraph Stage 2: Local Open-Weight LLM Reasoning
        G --> H{Task Classifier & Model Router}
        H -->|Multi-Agent Orchestration & SOPs| M1[NVIDIA Nemotron 3 Nano]
        H -->|Code Gen & Telemetry Scripts| M2[Qwen 2.5 Coder 1.5B]
        H -->|Enterprise RAG & Structured Data| M3[IBM Granite 4 1B-H]
        H -->|Text Summarization & Rewriting| M4[Google Gemma 3 1B]
        H -->|Mathematical Proofs & STEM Logic| M5[Microsoft Phi-4 Mini]
        H -->|Chain-of-Thought & Arithmetic| M6[SmolLM2 1.7B]
        H -->|Fast Conversational Assistance| M7[Meta Llama 3.2 1B]
    end

    M1 & M2 & M3 & M4 & M5 & M6 & M7 --> I[Universal Backend Execution Trace + User Output]
```

> [!IMPORTANT]
> **Gemma 3 1B and Llama 3.2 1B are text-only models**. They do not process raw pixel tensors. The Stage 1 PaddleOCR pipeline converts visual documents into deterministic, high-accuracy textual and tabular evidence tokens before language model prompting.

---

## 4. Hardware Scheduling & Single GPU Mutex

Operating on consumer hardware (NVIDIA GeForce RTX 2050 with 4GB VRAM) requires deterministic resource allocation:

| Operational Mode | OCR Device | LLM Device | Scheduling Guarantee |
| :--- | :--- | :--- | :--- |
| **Default Pipeline** | CPU (Multi-threaded OpenMP) | GPU (Ollama VRAM) | **Zero VRAM competition**. OCR runs on CPU while LLM is resident in GPU VRAM. |
| **Accelerated Batch OCR** | GPU (CUDA 12.5) | Unloaded / Idle | OCR utilizes CUDA for sub-second page batching when LLM inference is not in flight. |
| **Fallback Mode** | CPU (SIMD / AVX2) | CPU | 100% functional on non-CUDA systems. |

**Concurrency Mutex (`MAX_GPU_CONCURRENCY = 1`)**:
The workflow scheduler guarantees that GPU-heavy OCR kernels and Ollama LLM forward passes never contend for VRAM simultaneously, eliminating Out-Of-Memory (OOM) fatal crashes.

---

## 5. Supported Document Types & Processing Pipelines

| Document Type | Extensions | Processing Strategy | Output Formats |
| :--- | :--- | :--- | :--- |
| **Scanned PDF Reports** | `.pdf` | PyMuPDF page rasterization (300 DPI) → PP-DocLayout-S → PP-OCRv6 | Multi-page text, layout blocks, confidence scores |
| **Native Text PDFs** | `.pdf` | Multi-strategy Tj/TJ operator extraction with OCR image fallback | Clean content text (metadata and XMP filtered) |
| **P&ID / Engineering Schematics** | `.png`, `.jpg`, `.dwg`, `.dxf` | Adaptive CLAHE enhancement → High-res OCR → Instrument tag isolation (`TK-101`, `PSV-402`) | Tag maps, line connections, defect callouts |
| **Spreadsheets & Tables** | `.csv`, `.xlsx`, `.tsv` | Native parsing + SLANet visual table extraction | Markdown tables, JSON row arrays |
| **Industrial Inspection Forms** | Any image / PDF | Layout bounding box matching → Key-value field extraction | Key-value pairs (`Equipment ID`, `Thickness`, `Corrosion Rate`) |
| **Academic & Technical Papers** | `.pdf` | Document layout + SLANet tables + PP-FormulaNet LaTeX | Markdown with embedded LaTeX formulas and tables |
| **Problem Screenshots & Question Images** | `.png`, `.jpg`, `.jpeg`, `.webp` | Rapid orientation fix → PP-OCRv6 text extraction → Symmetrical Task Classifier | Clean question text, agent routing, evidence block |

---

## 6. Python OCR Service API Contracts (Port 8305)

The local Python compute server (`platform/ocr/service.py` / `platform/python-compute/` on port 8305) exposes high-speed REST endpoints:

### 6.1 Endpoints Specification

| Route | Method | Payload Parameters | Description |
| :--- | :--- | :--- | :--- |
| `/ocr/image` | `POST` | `{ "image_path"?: string, "image_base64"?: string, "lang"?: "en"\|"ta"\|"hi", "options"?: object }` | Single image OCR, bounding box detection, and character recognition. |
| `/ocr/document` | `POST` | `{ "file_path"?: string, "file_base64"?: string, "file_name"?: string, "lang"?: string, "options"?: object }` | Multi-page document/PDF rasterization, layout decomposition, and full-text extraction. |
| `/ocr/table` | `POST` | `{ "image_base64"?: string, "file_path"?: string, "options"?: object }` | Dedicated SLANet tabular recognition returning HTML/Markdown tables and row JSON. |
| `/ocr/health` | `GET` | _None_ | OCR engine readiness status, model inventory, and hardware acceleration state. |

### 6.2 Python OCR Service Response Schema

```json
{
  "success": true,
  "documentId": "doc-1787555015294",
  "fileName": "API-653-Inspection-Report.pdf",
  "mimeType": "application/pdf",
  "pages": [
    {
      "pageNumber": 1,
      "confidence": 0.962,
      "text": "EQUIPMENT INSPECTION REPORT\nTag No: TK-101\nMinimum Measured Thickness: 5.90 mm\nRetirement Limit: 6.80 mm",
      "blocks": [
        {
          "type": "header",
          "bbox": [50, 30, 750, 80],
          "content": "EQUIPMENT INSPECTION REPORT",
          "confidence": 0.98
        },
        {
          "type": "key_value",
          "bbox": [50, 90, 400, 140],
          "key": "Tag No",
          "value": "TK-101",
          "confidence": 0.97
        }
      ],
      "tables": [
        {
          "pageNumber": 1,
          "tableName": "Ultrasonic Thickness Measurements",
          "headers": ["Course", "Nominal (mm)", "Actual (mm)", "Status"],
          "rows": [
            { "Course": "Course 1", "Nominal (mm)": "12.0", "Actual (mm)": "11.8", "Status": "PASS" },
            { "Course": "Course 3", "Nominal (mm)": "8.0", "Actual (mm)": "5.9", "Status": "CRITICAL" }
          ],
          "markdown": "| Course | Nominal (mm) | Actual (mm) | Status |\n| --- | --- | --- | --- |\n| Course 1 | 12.0 | 11.8 | PASS |\n| Course 3 | 8.0 | 5.9 | CRITICAL |"
        }
      ]
    }
  ],
  "fullText": "EQUIPMENT INSPECTION REPORT\nTag No: TK-101...",
  "confidence": 0.962,
  "metadata": {
    "pageCount": 1,
    "ocrEngine": "PaddleOCR 3.7.0 / PP-OCRv6 Small + SLANet",
    "device": "cpu",
    "isAirGapped": true,
    "externalCalls": 0
  }
}
```

---

## 7. Gateway OCR & Ingestion Endpoints (Port 8300)

The central Node.js Gateway (`platform/gateway/src/server.js`) exposes high-level multimodal endpoints consumed by the web UI and desktop clients:

### 7.1 Gateway Endpoints

| Route | Method | Payload | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/ocr/analyze-image` | `POST` | `{ "attachment": { "name": string, "type": string, "data": string } }` | Universal image question auto-read, confidence scoring, and agent classification. |
| `/api/attachments/extract` | `POST` | `{ "file": { "name": string, "type": string, "data": string } }` | Universal attachment extraction (alias for `/api/ocr/analyze-image`). |
| `/api/ocr` | `POST` | `{ "attachment": object, "options"?: object }` | Gateway route for direct OCR question processing and evidence bundling. |

### 7.2 Unified Image Question Extraction Response

```json
{
  "status": "success",
  "sourceType": "image",
  "fileName": "manager-review-request.png",
  "text": "Write a professional email to my manager requesting a project review",
  "confidence": 0.96,
  "confidenceLevel": "HIGH",
  "blocks": [],
  "tables": [],
  "pages": [
    {
      "pageNumber": 1,
      "text": "Write a professional email to my manager requesting a project review",
      "confidence": 0.96
    }
  ],
  "classification": {
    "taskType": "EMAIL_WRITING",
    "taskLabel": "Email Writing",
    "agentId": "agent-002",
    "agentNumber": "002",
    "agentName": "Email AI Agent",
    "domain": "Writing & Communication",
    "recommendedModel": "nemotron-3-nano:latest"
  },
  "evidenceBlock": "[IMAGE OCR EVIDENCE]\nSource: manager-review-request.png\nExtracted Text: Write a professional email to my manager requesting a project review\nOCR Confidence: 0.96\n[/IMAGE OCR EVIDENCE]",
  "effectivePrompt": "[IMAGE OCR EVIDENCE]\nSource: manager-review-request.png\nExtracted Text: Write a professional email to my manager requesting a project review\nOCR Confidence: 0.96\n[/IMAGE OCR EVIDENCE]\n\nPlease fulfill the above request: Write a professional email to my manager requesting a project review",
  "backendTrace": {
    "attachmentReceived": "manager-review-request.png",
    "inputType": "Image",
    "ocrEngine": "PaddleOCR 3.7.0 (PP-OCRv6 + PP-StructureV3)",
    "ocrResult": "Write a professional email to my manager requesting a project review",
    "taskClassification": "Email Writing",
    "agentDispatched": "Email AI Agent (Agent 002)",
    "modelEngine": "nemotron-3-nano:latest",
    "hardware": "NVIDIA RTX 2050",
    "externalCalls": 0,
    "executionTrace": "audit-img-4a7b1c8e9f2d",
    "elapsedMs": 1180
  },
  "is_air_gapped": true,
  "external_calls": 0
}
```

---

## 8. Image Question Auto-Read + Auto-Answer System Integration

When a user drops an image into the chat interface without typing any instructions:

1. **Automatic Ingestion**: The gateway intercepts the upload and invokes `ImageQuestionPipeline.processImageQuestion()`.
2. **Offline OCR Invocations**: Calls `POST http://127.0.0.1:8305/ocr/image` with the base64-encoded image.
3. **Intent Classification**: Evaluates the recognized text using `classifyTaskAndAgent(rawText)` in `platform/multimodal/task-classifier.js`.
4. **Symmetrical Routing**:
   - If the image contains an email prompt $\rightarrow$ Dispatches **Email AI Agent (002)** on `nemotron-3-nano:latest`.
   - If the image contains Python code / async instructions $\rightarrow$ Dispatches **Python AsyncIO AI Agent (101)** on `qwen2.5-coder:1.5b`.
   - If the image contains arithmetic / STEM equations $\rightarrow$ Dispatches **Study AI Agent (003)** on `phi4-mini`.
5. **Direct Answer Generation**: The response is streamed to the UI with zero delimiter leakage and full offline voice readout capability.

*For complete details on the 8-step pipeline, see [Image Question Routing Architecture](IMAGE-QUESTION-ROUTING.md).*

---

## 9. Confidence Calibration & Thresholding

Every recognized character, line, and table bounding box is scored against calibrated confidence thresholds:

| Level | Threshold | Action | Visual Representation |
| :--- | :--- | :--- | :--- |
| **HIGH** | $\text{Confidence} \ge 0.90$ | Direct ingestion into LLM context without caveats. | Green Badge |
| **MEDIUM** | $0.70 \le \text{Confidence} < 0.90$ | Retained with soft verification flag in evidence graph. | Yellow Badge |
| **LOW** | $\text{Confidence} < 0.70$ | Preserved with low-confidence warning for human-in-the-loop review. | Red Badge |

---

## 10. Security & Sovereign Isolation

1. **Zero Data Egress**: All rasterization, OpenCV image processing, neural inference, and bounding box math occur inside local memory (`127.0.0.1:8305`).
2. **Path Traversal Protection**: Filenames and paths are sanitized using strict basename resolution to prevent arbitrary file read attacks.
3. **Transient File Lifecycle**: Ephemeral image rasters generated during PDF parsing are scrubbed from system memory immediately following feature extraction.
4. **Anti-Leakage Grounding**: Delimiter tags (`[IMAGE OCR EVIDENCE]`) are strictly suppressed from user-facing views to guarantee clean UI presentation and pristine voice TTS readout.
