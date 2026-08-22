# SIH MRPL SOVEREIGN AI WORKBENCH — REQUIREMENT TRACEABILITY MATRIX

**Problem Statement:** Sovereign On-Premise Agentic AI Workbench using Open-Weight Multimodal LLMs for Confidential Industrial Work  
**Organization:** Mangalore Refinery and Petrochemicals Limited (MRPL)  
**Theme:** Smart Automation / Software  
**Document Status:** Complete & Traceable  
**Date:** August 22, 2026  

---

## 1. COMPREHENSIVE 30-REQUIREMENT TRACEABILITY MATRIX

| Req # | Problem Statement Requirement | Architecture Component | Implementation File / Module | Flagship Demo Scenario | Verification Test Suite |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | **On-premise / air-gapped operation** | Sovereign Policy Gate | `platform/security/sovereign-policy.js` | Full offline execution in air-gapped simulation | `tests/sih/sovereignty.test.js` |
| **2** | **Multiple open-weight models** | Local Model Gateway | `platform/models/model-registry.js` | Live switching between Nemotron, Vision, Code models | `tests/sih/model-router.test.js` |
| **3** | **Automatic model selection** | Task Classifier & Router | `platform/models/model-router.js` | Automatic routing of text vs vision vs code requests | `tests/sih/model-router.test.js` |
| **4** | **Task planning & decomposition** | Sovereign Orchestrator | `platform/intelligence/router.js` (Agent 101) | 8-step visual DAG execution plan | `tests/sih/orchestrator.test.js` |
| **5** | **Multi-step agentic execution** | Multi-Agent Coordinator | `platform/intelligence/coordinator.js` | Multi-agent inspection report synthesis | `tests/sih/workflow.test.js` |
| **6** | **Local file tools** | Tool Registry & Permissions | `platform/tools/tool-registry.js` | Secure local file read, write, list, inspect | `tests/sih/tools.test.js` |
| **7** | **Code execution sandbox** | Isolated Code Sandbox | `platform/sandbox/code-sandbox.js` | Safe execution of Python calculations with limits | `tests/sih/sandbox.test.js` |
| **8** | **Spreadsheet operations** | Excel / CSV Engine | `platform/tools/tool-registry.js` (`read_excel`, `write_excel`) | Parsing equipment cost sheets & anomaly detection | `tests/sih/spreadsheet.test.js` |
| **9** | **Internal document search** | Local Vector RAG Engine | `platform/knowledge/rag-engine.js` | Querying refinery SOPs & engineering standards | `tests/sih/rag.test.js` |
| **10** | **Multimodal understanding** | Multimodal Pipeline | `platform/multimodal/document-pipeline.js` | Ingestion of mixed PDF, images, diagrams | `tests/sih/multimodal.test.js` |
| **11** | **Scanned PDF processing** | Local OCR & Layout Engine | `platform/multimodal/ocr-engine.js` | OCR extraction from scanned inspection reports | `tests/sih/multimodal.test.js` |
| **12** | **Handwritten notes** | Handwriting Analysis Agent | `platform/multimodal/handwriting-parser.js` | Extracting field engineer handwritten notes | `tests/sih/multimodal.test.js` |
| **13** | **Engineering drawings** | Drawing & P&ID Analyst | `platform/multimodal/drawing-analyzer.js` | Component tag & valve symbol extraction | `tests/sih/multimodal.test.js` |
| **14** | **Photographs & site images** | Visual Defect Specialist | `platform/multimodal/image-analyzer.js` | Visual inspection of corrosion & damaged flanges | `tests/sih/multimodal.test.js` |
| **15** | **Local OCR** | Tesseract / Local OCR Service | `platform/multimodal/ocr-engine.js` | High-accuracy text extraction without cloud APIs | `tests/sih/multimodal.test.js` |
| **16** | **Local vision** | Local Multimodal Provider | `platform/models/providers/local-vision.js` | Vision inference via local open weights | `tests/sih/model-router.test.js` |
| **17** | **Local knowledge base** | Vector & Semantic Index | `platform/knowledge/knowledge-store.js` | Grounding answers in refinery maintenance manuals | `tests/sih/rag.test.js` |
| **18** | **SOP/manual grounding** | Epistemic Reasoner | `platform/intelligence/reasoner.js` | Strict fact verification with exact SOP page citations | `tests/sih/evidence.test.js` |
| **19** | **Past correspondence grounding**| Knowledge Retrieval Agent | `platform/knowledge/rag-engine.js` | Referencing previous inspection work orders | `tests/sih/rag.test.js` |
| **20** | **Real deliverables generation** | Deliverables Engine | `platform/deliverables/deliverable-engine.js` | Generating multi-format output packages | `tests/sih/deliverables.test.js` |
| **21** | **Word document generation** | DOCX Generator | `platform/deliverables/docx-generator.js` | Auto-generating official `Approval_Note.docx` | `tests/sih/deliverables.test.js` |
| **22** | **PowerPoint generation** | PPTX Generator | `platform/deliverables/pptx-generator.js` | Generating `Management_Briefing.pptx` | `tests/sih/deliverables.test.js` |
| **23** | **Excel workbook generation** | XLSX Generator | `platform/deliverables/xlsx-generator.js` | Generating structured `Inspection_Analysis.xlsx` | `tests/sih/deliverables.test.js` |
| **24** | **Working code generation** | Code Generation Specialist | `platform/sandbox/code-sandbox.js` | Synthesizing verified Python inspection script | `tests/sih/sandbox.test.js` |
| **25** | **Calculations with steps** | Technical Calculation Tool | `platform/tools/tool-registry.js` (`calculate_step_by_step`) | Computing corrosion rates & wall loss with formulas | `tests/sih/tools.test.js` |
| **26** | **Visible network monitoring** | Real-time Egress Monitor | `platform/security/egress-monitor.js` | Live traffic classification stream in UI | `tests/sih/sovereignty.test.js` |
| **27** | **Proof of zero external calls**| Sovereignty Center | `platform/security/sovereignty-center.js` | Persistent zero-egress counter & telemetry ledger | `tests/sih/no-external-egress.test.js`|
| **28** | **Model extensibility** | Pluggable Model Registry | `platform/models/model-registry.js` | Adding new GGUF/Ollama model definitions dynamically | `tests/sih/model-router.test.js` |
| **29** | **Mid-range GPU support** | Hardware Memory Profiler | `platform/models/hardware-profiler.js` | Dynamic quantization & bounded concurrency for RTX 2050 | `tests/sih/hardware.test.js` |
| **30** | **End-to-end industrial demo** | Flagship Industrial Demo | `platform/workflow-engine/definitions/inspection-report-analysis.js` | One-click Scanned Inspection Report Analysis | `tests/sih/flagship-demo.test.js` |

---

## 2. VERIFICATION PROTOCOL

Every requirement listed above is backed by:
1. **Concrete Source Code Implementation** in `platform/` and `registry/`.
2. **Automated Test Cases** in `tests/sih/`.
3. **Interactive UI Visualization** in the Sovereign Workbench UI.
4. **Zero Cloud API Reliance** in Sovereign Mode.
