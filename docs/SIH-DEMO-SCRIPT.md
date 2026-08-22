# SIH DEMONSTRATION SCRIPT — SOVEREIGN AI WORKBENCH

**Project:** Sovereign AI Workbench  
**Client:** Mangalore Refinery and Petrochemicals Limited (MRPL)  
**Target Duration:** 5 to 7 Minutes  
**Demonstration Mode:** 100% Offline / Air-Gapped Local Execution  

---

## ⏱️ MINUTE-BY-MINUTE SCRIPT & WALKTHROUGH

### 0:00 – 0:45 | 1. THE PROBLEM & SOVEREIGN MANDATE
- **Speaker:** "Respected Judges, confidential refinery operations at Mangalore Refinery and Petrochemicals Limited (MRPL) cannot risk transmitting proprietary NDT inspection data, P&ID schematics, or equipment failure reports to public cloud AI APIs like OpenAI or Anthropic. 
- We present the **Sovereign AI Workbench** — an air-gapped, on-premise multi-agent workforce powered by open-weight multimodal models with zero data exfiltration."

### 0:45 – 1:30 | 2. ON-PREMISE ARCHITECTURE & TELEMETRY
- **Action:** Open Sovereign AI Workbench UI (`http://127.0.0.1:8080`).
- **Speaker:** "Notice the top-right indicator: **EXTERNAL EGRESS: 0 CALLS**. The workbench operates locally on an NVIDIA RTX 2050 (4GB VRAM) with 3 quantized open-weight models: NVIDIA Nemotron 3 Nano for reasoning, Local Multimodal Engine for vision/OCR, and Local Code Specialist."

### 1:30 – 2:30 | 3. MULTIMODAL INGESTION & LOCAL OCR
- **Action:** Click **"Run Flagship Industrial Demo"** (Tank TK-101 Scanned Ultrasonic Report).
- **Speaker:** "Step 1 executes local OCR on a noisy scanned NDT thickness report. It extracts measurements without cloud APIs, detecting that Shell Course 3 minimum thickness is **5.90 mm** against a retirement threshold of **6.80 mm**."

### 2:30 – 3:30 | 4. LOCAL RAG GROUNDING & MATH VERIFICATION
- **Action:** View the step execution and local citations.
- **Speaker:** "Step 2 triggers the NDT Thickness Agent (`agent-058`) to calculate the corrosion rate (0.42 mm/year) and remaining life. Step 3 queries the Local Knowledge Base across on-premise OISD-STD-129 and API-653 standards, returning Section 4.3.3 and Page 14 citations proving the tank must be isolated immediately."

### 3:30 – 4:45 | 5. REAL DELIVERABLES GENERATION
- **Action:** Open the Deliverables Center.
- **Speaker:** "Step 4 generates real industrial deliverable files directly on-premise:
  1. `Approval_Note_TK101.docx` — Formal memorandum for General Manager authorization.
  2. `Inspection_Analysis_TK101.xlsx` — Multi-column thickness log with formula verification.
  3. `Management_Briefing_TK101.pptx` — 4-slide executive briefing deck."

### 4:45 – 5:30 | 6. HUMAN-IN-THE-LOOP & CRYPTOGRAPHIC AUDIT
- **Action:** Click **"Approve & Authorize Outage"** in the Pending Approvals tab.
- **Speaker:** "The Sovereign Orchestrator enforces Human-in-the-Loop governance for high-risk decisions. Once signed off, the full immutable audit trail records every agent, tool, model, and decision."

### 5:30 – 6:00 | 7. VERIFICATION OF ZERO DATA EXFILTRATION
- **Action:** Switch to the **Sovereignty Center & Real-time Network Monitor**.
- **Speaker:** "Here is our cryptographic proof: all requests are classified as Local Loopback. External AI calls remain strictly at **0**. Total security, total sovereignty, total intelligence."
