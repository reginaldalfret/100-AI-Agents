# OCR & Document Intelligence Engine

> **Engine**: PaddleOCR 3.7.0 · PP-OCRv6 Small · PP-StructureV3
> **Mode**: 100% Offline · CPU-Primary · Optional GPU Acceleration
> **Status**: Production

---

## Architecture Overview

```
INPUT (Image / PDF / Screenshot / Receipt / Invoice / Form)
  ↓
Local Preprocessing (Orientation, Deskew, Denoise, CLAHE)
  ↓
PP-DocLayout-S (23-class Document Layout Analysis)
  ↓
PP-OCRv6 Small (Text Detection + Recognition, 50 Languages)
  ↓
SLANet (Table Structure Recognition)
  ↓
PP-FormulaNet-S (Formula → LaTeX) [Optional]
  ↓
Reading Order Reconstruction
  ↓
Canonical Structured Document (JSON / Markdown)
  ↓
Local LLM Reasoning (Nemotron / Granite / Phi / Gemma / DeepSeek)
```

---

## Model Inventory

| Model | Purpose | Size | Required | Languages |
| :--- | :--- | :--- | :--- | :--- |
| **PP-OCRv6 Small Detection** | Text region detection | 9.6 MB | Yes | 50 languages |
| **PP-OCRv6 Small Recognition** | Character recognition | 14.5 MB | Yes | 50 languages |
| **Text Orientation Classifier** | 0°/180° angle correction | 1.4 MB | Yes | Universal |
| **PP-DocLayout-S** | Document layout analysis | 15 MB | Yes | Universal |
| **SLANet** | Table structure recognition | 9 MB | Yes | Universal |
| **PP-FormulaNet-S** | Formula → LaTeX | 12 MB | No | Universal |

**Total Required**: ~49.5 MB · **Total with Optional**: ~61.5 MB

---

## Offline Deployment

All OCR model weights are bundled locally at installation time:

```
platform/ocr/models/
├── detection/PP-OCRv6_det_small/
├── recognition/PP-OCRv6_rec_small/
├── classification/ch_ppocr_mobile_v2.0_cls/
├── layout/PP-DocLayout-S/
├── table/SLANet/
├── formula/PP-FormulaNet-S/
└── manifest.json
```

### Zero Runtime Downloads

- Models verified via SHA-256 checksums at startup
- If any required model is missing: `"Required offline OCR model is missing or corrupted"`
- **No internet connection required during normal operation**
- **No cloud OCR API calls** (Google Vision, Azure, OpenAI — NONE)

---

## Supported Document Types

| Type | Extension | Processing |
| :--- | :--- | :--- |
| Image | `.png`, `.jpg`, `.jpeg`, `.bmp`, `.tiff` | Direct OCR |
| PDF (text-based) | `.pdf` | Text extraction + OCR fallback |
| PDF (scanned) | `.pdf` | Page rasterization → OCR |
| Multi-page PDF | `.pdf` | Page-by-page processing |
| Screenshot | `.png`, `.jpg` | Direct OCR |
| Receipt / Invoice | Any image | OCR + Layout + Tables |
| Form | Any image / PDF | OCR + Layout |
| Academic Paper | PDF | OCR + Layout + Formulas |

---

## GPU / CPU Behavior

| Scenario | Behavior |
| :--- | :--- |
| GPU available + no LLM loaded | OCR uses GPU (fastest) |
| GPU available + LLM loaded | OCR uses CPU (safe, avoids VRAM conflict) |
| GPU unavailable | OCR uses CPU (automatic fallback) |
| CUDA initialization fails | OCR uses CPU (silent fallback) |
| Insufficient VRAM | OCR uses CPU (automatic) |

**GPU concurrency**: MAX_GPU_CONCURRENCY = 1. OCR and LLM never use GPU simultaneously.

---

## Output Schema

```json
{
  "document": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "pdf",
    "filename": "invoice.pdf",
    "pages": 3,
    "processingTimeMs": 4200,
    "device": "cpu",
    "engine": "PP-OCRv6-Small + PP-StructureV3"
  },
  "pages": [
    {
      "pageNumber": 1,
      "text": [
        {
          "text": "Invoice Number: INV-2026-001",
          "confidence": 0.98,
          "bbox": [120, 240, 720, 285],
          "order": 1,
          "confidenceLevel": "HIGH"
        }
      ],
      "blocks": [
        {
          "type": "title",
          "bbox": [50, 30, 750, 80],
          "content": "TAX INVOICE",
          "confidence": 0.97
        }
      ],
      "tables": [],
      "formulas": [],
      "charts": [],
      "confidence": 0.96
    }
  ],
  "fullText": "TAX INVOICE\nInvoice Number: INV-2026-001\n...",
  "markdown": "# TAX INVOICE\n\n**Invoice Number**: INV-2026-001\n...",
  "metadata": {
    "languages": ["en"],
    "orientation": 0,
    "isAirGapped": true,
    "externalCalls": 0
  }
}
```

---

## Confidence System

| Level | Threshold | Visual |
| :--- | :--- | :--- |
| **HIGH** | ≥ 0.90 | Green |
| **MEDIUM** | 0.70 – 0.89 | Yellow |
| **LOW** | < 0.70 | Red |

Low-confidence text is preserved (not discarded) for downstream validation.

---

## API Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/ocr/image` | POST | Single image OCR |
| `/api/ocr/document` | POST | Full document parsing (PDF/image) |
| `/api/ocr/table` | POST | Table-only extraction |
| `/api/ocr/parse` | POST | Full document understanding |
| `/api/ocr/health` | GET | OCR engine health check |

---

## OCR Task Types

| Task Type | Pipeline |
| :--- | :--- |
| `OCR_TEXT` | PP-OCRv6 only (fast text extraction) |
| `DOCUMENT_PARSE` | Layout + OCR + Tables |
| `TABLE_EXTRACTION` | Table regions → SLANet |
| `FORMULA_EXTRACTION` | Formula regions → PP-FormulaNet |
| `LAYOUT_ANALYSIS` | PP-DocLayout only |
| `FULL_DOCUMENT_UNDERSTANDING` | All pipelines combined |

---

## Language Support

| Language | Status | Model |
| :--- | :--- | :--- |
| **English** | ✅ Production | PP-OCRv6 unified (50 languages) |
| **Tamil** | ✅ Supported | `ta_PP-OCRv4_mobile_rec` (dedicated) |
| **Hindi / Devanagari** | ✅ Supported | `devanagari_PP-OCRv5_mobile_rec` (dedicated) |
| **Latin languages (50)** | ✅ Supported | PP-OCRv6 unified |

---

## OCR → LLM Integration Architecture

```
IMAGE / DOCUMENT
        ↓
PP-StructureV3 (Layout + Tables + Formulas)
        ↓
PP-OCRv6 (Text Detection + Recognition)
        ↓
STRUCTURED DOCUMENT (JSON)
        ↓
LOCAL LLM SELECTION
        ↓
├─ Gemma 3 1B      → Text reasoning on extracted content
├─ Granite 4 1B-H  → RAG extraction / structured tasks
├─ Phi-4 Mini      → Mathematical reasoning on formulas
├─ DeepSeek-R1     → Step-by-step logic on OCR results
├─ Nemotron 3 Nano → Orchestration & synthesis
└─ Qwen 2.5 Coder  → Code/data extraction
```

**IMPORTANT**: Gemma 3 1B is TEXT-ONLY. It does NOT perform OCR.
The OCR pipeline (PaddleOCR) extracts text first, then LLMs reason on the extracted text.

---

## Installation

All OCR components are bundled in the desktop installer:

1. Python 3.11 runtime (venv)
2. PaddlePaddle (CPU)
3. PaddleOCR 3.7.0
4. All model weights (~62 MB)
5. OpenCV, PyMuPDF, dependencies

User experience: **Install → Open → OCR Ready**. No manual setup required.

---

## Troubleshooting

| Issue | Resolution |
| :--- | :--- |
| "Required offline OCR model is missing" | Reinstall application or restore model files |
| OCR is slow | CPU mode is normal (~2-5s/page). Close LLMs to enable GPU mode |
| Blank OCR result | Check image quality. Try preprocessing options |
| PDF fails | Ensure PDF is not password-protected |
| CUDA error | OCR automatically falls back to CPU |
| Out of memory | Reduce PDF DPI or process fewer pages at once |

---

## Security

- Documents processed **locally only** — never uploaded externally
- Temporary files cleaned after processing
- Filename sanitization prevents path traversal
- Configurable file size limits
- No credentials logged
