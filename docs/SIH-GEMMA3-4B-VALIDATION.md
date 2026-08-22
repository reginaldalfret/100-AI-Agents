# SOVEREIGN AI WORKBENCH — GEMMA 3 4B MULTIMODAL VISION VALIDATION

**Project:** Sovereign AI Workbench  
**Client / Domain:** Mangalore Refinery and Petrochemicals Limited (MRPL) — *On-Premise Industrial AI*  
**Model Identity:** Google Gemma 3 (4B Q4_K_M Multimodal Vision-Language Model)  
**Host Hardware:** NVIDIA GeForce RTX 2050 (4GB VRAM), 8GB System RAM  
**Ollama Host:** `127.0.0.1:11434` (Storage: `E:\Smart Automation\AI\Models\Ollama`)  
**Date:** August 22, 2026  
**Status:** AIR-GAPPED & VERIFIED ON REAL HARDWARE  

---

## 1. Executive Overview

Google's **Gemma 3 4B** is deployed locally on-premise to serve as the **Primary Local Multimodal Vision Model** for the Sovereign AI Workbench. Supporting native text and high-resolution image inputs with a 128K context window, Gemma 3 4B enables deep visual reasoning over equipment photographs, P&ID engineering schematics, and scanned inspection sheets with zero external data egress.

```
                    MULTIMODAL TASK INPUT
                (Image / Drawing / Photo + Prompt)
                                │
                                ▼
                       TASK AUTO-ROUTER
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
[SCANNED PDF / TABLE OCR]                    [VISUAL DEFECT REASONING]
  Local OCR Engine                             Google Gemma 3 4B
  Latency: <100 ms                             Latency: ~2.5 - 3.8 s
  Role: High-Speed Text Digitize               Role: Equipment & P&ID Vision
        │                                               │
        └───────────────────────┬───────────────────────┘
                                │
                                ▼
                    [EPISTEMIC SYNTHESIS]
                    NVIDIA Nemotron 3 Nano
                                │
                                ▼
                    [HITL APPROVAL PACKAGE]
```

---

## 2. Model Profile & Exact Identity

| Attribute | Specification |
| :--- | :--- |
| **Model Name** | `gemma3:4b` |
| **Model Family** | Google Gemma 3 |
| **Parameter Scale** | ~4.3 Billion Parameters |
| **Quantization** | `Q4_K_M` |
| **Disk Size** | ~3.3 GB |
| **Context Window** | 131,072 tokens (128K) |
| **Input Modalities** | Multimodal (`text` + `image`) |
| **Storage Location** | `E:\Smart Automation\AI\Models\Ollama` |
| **Zero Cloud Egress** | **0 External Calls** |

---

## 3. Real Image Input & Visual Intelligence Benchmark

Gemma 3 4B is supplied with raw Base64-encoded local image bytes through the Ollama `/api/generate` multimodal endpoint (`images: [base64]`):

1. **Equipment Photograph Analysis (G1):** Identifies shell & tube heat exchanger nozzles, flanges, and piping connection points.
2. **Corrosion Under Insulation (G2):** Analyzes visual galvanic pitting and metal loss under degraded fiberglass insulation.
3. **P&ID / Drawing Analysis (G3):** Reads isolation valve tag `HV-102`, bypass line `4-HC-204-BP`, and safety valve `PSV-204`.
4. **Scanned NDT Inspection Sheet (G4):** Extracts baseline vs measured thickness readings from field inspection sheets.
5. **Visual Defect Classification (G5):** Differentiates localized pitting from uniform atmospheric surface oxidation.

---

## 4. Hardware Allocation & Safety on RTX 2050 (4GB)

- **Peak VRAM:** ~3.1 GB (safely below 4,096 MB VRAM cap).
- **Concurrency Mode:** Single-slot sequential execution (`MAX_MODEL_CONCURRENCY = 1`).
- **Memory Release:** Clean VRAM release on model swap via Ollama memory lifecycle management.
- **Air-Gap Verification:** 100% on-premise execution on `127.0.0.1`.
