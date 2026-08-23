# Multimodal Document & Image Understanding Architecture

**Platform:** Sovereign AI Workbench  
**Hardware:** NVIDIA RTX 2050 4GB VRAM / 8GB RAM  
**Multimodal Model:** Google Gemma 3 4B (`gemma3:4b`)  
**Reasoning Model:** NVIDIA Nemotron 3 Nano (`nemotron-3-nano:latest`)  
**Coding/Data Model:** Qwen 2.5 Coder 1.5B (`qwen2.5-coder:1.5b`)  

---

## 1. Pipeline Overview

```
USER ATTACHMENT (Image, PDF, CSV, DOCX, Code)
      │
      ▼
UNIVERSAL EXTRACTOR (document-extractor.js)
      │
      ├────── IMAGE (.png, .jpg, .webp) ─────> Base64 Image Array ──> GOOGLE GEMMA 3 (Vision)
      │
      ├────── CSV / TSV ─────────────────────> Markdown Table ──────> QWEN 2.5 CODER / NEMOTRON
      │
      ├────── PDF / DOCX ────────────────────> Extracted Text ──────> NVIDIA NEMOTRON 3 (Reasoning)
      │
      └────── CODE / SCRIPT (.py, .js, .sql) ─> Source Text ─────────> QWEN 2.5 CODER (Coding)
                                                      │
                                                      ▼
                                       STRUCTURED PROMPT INJECTION
                                                      │
                                                      ▼
                                        GROUNDED STREAMING RESPONSE
```

---

## 2. Ingestion Guarantees

1. **Attachment ≠ Token Ignorance**: The system converts attached files into actual text, tables, or visual tokens before model invocation.
2. **True Air-Gap**: 100% local extraction and parsing; zero cloud API calls or data egress.
3. **Hardware Safe**: Memory footprint is bounded and single-GPU concurrency is enforced.
