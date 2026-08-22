# SIH MRPL SOVEREIGN AI WORKBENCH — TEST PLAN & VERIFICATION MATRIX

**Project:** Sovereign AI Workbench  
**Client:** Mangalore Refinery and Petrochemicals Limited (MRPL)  
**Test Harness Location:** `tests/sih/`  
**Execution Target:** 100% Pass Rate across all unit, integration, security, and air-gapped acceptance suites  
**Date:** August 22, 2026  

---

## 1. TEST SUITE STRUCTURE

```
tests/sih/
├── test-plan.md                   # This document
├── harness.js                     # Unified test execution runner & reporter
├── sovereignty.test.js            # Air-gapped network egress policy & blocking
├── no-external-egress.test.js     # Runtime network sniffer proving External Calls = 0
├── model-router.test.js           # Multi-model selection, fallback, and task routing
├── multimodal.test.js             # Scanned PDF, OCR, photos, layout & drawings
├── rag.test.js                    # Local document chunking, vector search, SOP citations
├── tools.test.js                  # Permissioned file & calculation tools
├── sandbox.test.js                # Python/Node isolated execution with timeouts & limits
├── deliverables.test.js           # Real DOCX, XLSX, PPTX, PDF, Code generation
├── workflow.test.js               # Industrial workflows (Inspection, Safety, Overrides)
├── orchestrator.test.js           # Agent 101 DAG planning, decomposition & evidence
├── fleet.test.js                  # 101/101 Industrial fleet regression & health
└── flagship-demo.test.js          # One-click Scanned Inspection Report Analysis
```

---

## 2. DETAILED TEST SPECIFICATIONS

### 2.1 Sovereignty & Zero Egress (`sovereignty.test.js` & `no-external-egress.test.js`)
- **Policy Enforcement:** Verifies that `platform/security/sovereign-policy.js` classifies local loopback (`127.0.0.1`, `localhost`) as `LOCAL` and allows it.
- **Egress Interception:** Tests that public IPs (`8.8.8.8`, `api.openai.com`, cloud LLMs) are blocked with `SOVEREIGN_EGRESS_BLOCKED`.
- **Telemetry Counter:** Confirms that `External Calls = 0` throughout the entire test suite run.

### 2.2 Local Model Router (`model-router.test.js`)
- **Model Registry:** Verifies registration of Nemotron 3 Nano, local vision models, and code models.
- **Auto-Selection:**
  - Text prompts -> `nemotron-3-nano`
  - Scanned PDFs / Images -> `local-vision-ocr`
  - Scripting / Python tasks -> `local-code-model`
- **Graceful Fallback:** Tests fallback to secondary local models without calling external APIs.

### 2.3 Multimodal Processing (`multimodal.test.js`)
- **Scanned PDF Ingestion:** Tests document extraction from multi-page PDFs with page references.
- **Local OCR:** Validates text extraction from simulated scans and noisy text.
- **Drawing / P&ID Analysis:** Extracts equipment tags (`TK-101`, `P-201A`, `PSV-401`) and line numbers.
- **Photo Defect Inspection:** Analyzes corrosion severity and flange condition images.

### 2.4 Local Vector RAG & Knowledge Base (`rag.test.js`)
- **Document Chunking:** Splits technical SOPs into semantic sections.
- **Local Vector Search:** Matches user queries against refinery manuals without cloud embeddings.
- **Exact Provenance:** Every response returns document filename, page number, and section title.

### 2.5 Secure Code Sandbox (`sandbox.test.js`)
- **Isolated Execution:** Runs Python scripts in a dedicated workspace directory.
- **Resource Constraints:** Enforces timeout limits and blocks attempts to escape the sandbox or read unauthorized paths.

### 2.6 Deliverables Engine (`deliverables.test.js`)
- **`Approval_Note.docx`:** Produces valid Word document with executive summary, findings, risk level, and sign-off table.
- **`Inspection_Analysis.xlsx`:** Generates structured Excel workbook with data tables and calculation formulas.
- **`Management_Briefing.pptx`:** Creates multi-slide presentation with technical telemetry and recommendations.

### 2.7 Industrial Workflows & Sovereign Orchestrator (`workflow.test.js` & `orchestrator.test.js`)
- **DAG Execution:** Step 1 (OCR) -> Step 2 (Vision) -> Step 3 (SOP Search) -> Step 4 (Risk) -> Step 5 (Deliverables).
- **Conflict Detection:** Flags discrepancy between field inspection measurements and design baseline.
- **Human-In-The-Loop:** High-risk operational decisions require administrative approval.

### 2.8 Flagship Demo Verification (`flagship-demo.test.js`)
- Runs the complete end-to-end scenario:
  *Input:* Scanned Tank Inspection Report -> *Processing:* OCR + Vision + SOP Check -> *Output:* Approval Note DOCX + XLSX + PPTX -> *Verification:* External Calls = 0.
