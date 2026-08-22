# SIH FINAL DEMONSTRATION SCRIPT (6 MINUTES)

**Project:** Sovereign AI Workbench  
**Client:** Mangalore Refinery and Petrochemicals Limited (MRPL)  
**Hardware:** On-Premise Laptop / Workstation with NVIDIA RTX 2050 (4GB VRAM)  
**Mode:** 100% Air-Gapped / Sovereign Mode  

---

## ⏱️ 6-MINUTE TIME-STAMPED PRESENTATION FLOW

### [00:00 – 00:30] THE PROBLEM: CONFIDENTIAL INDUSTRIAL WORK
> *"Respected Jury, critical petrochemical infrastructure like Mangalore Refinery cannot risk sending sensitive inspection dossiers, P&ID schematics, and equipment failure reports to public cloud AI APIs.*  
> *We present the **Sovereign AI Workbench** — an air-gapped on-premise workforce powered by open-weight multimodal LLMs with zero data exfiltration."*

---

### [00:30 – 01:00] ON-PREMISE ARCHITECTURE & TELEMETRY
> *(Presenter points to top-right corner of Workbench UI)*  
> *"Notice our live telemetry: **EXTERNAL EGRESS = 0 CALLS**. Everything runs locally on an NVIDIA RTX 2050 4GB GPU using 3 quantized open-weight models: NVIDIA Nemotron 3 Nano for reasoning, Local Multimodal Engine for vision/OCR, and Local Code Specialist."*

---

### [01:00 – 01:45] MULTIMODAL INGESTION & LOCAL OCR
> *(Presenter clicks 'Run Flagship Industrial Demo' for Heat Exchanger HX-204)*  
> *"An engineer uploads a noisy scanned ultrasonic thickness report. In Step 1, our Local OCR extracts the thickness grid without cloud APIs, detecting that Shell Course 3 minimum thickness is **5.90 mm** against a retirement minimum of **6.80 mm**."*

---

### [01:45 – 02:45] MATH VERIFICATION & LOCAL RAG GROUNDING
> *"In Step 2, the NDT Thickness Agent calculates a corrosion rate of **0.42 mm/year**, indicating the retirement limit has already been breached.*  
> *In Step 3, our Local RAG queries on-premise OISD-STD-129 and API-653 standards, returning exact Section 3.1 and Page 14 citations mandating emergency de-inventory and shell patch welding."*

---

### [02:45 – 03:45] REAL DELIVERABLES GENERATION
> *(Presenter opens the Deliverables Center)*  
> *"In Step 4, the workbench synthesizes three actual, formatted institutional deliverables directly on-premise:
> 1. `Approval_Note_HX204.docx` — Formal memorandum for General Manager authorization.
> 2. `Inspection_Analysis_HX204.xlsx` — Multi-column thickness log with formula verification.
> 3. `Management_Briefing_HX204.pptx` — 4-slide executive briefing deck."*

---

### [03:45 – 04:45] HUMAN-IN-THE-LOOP AUTHORIZATION
> *(Presenter navigates to Pending Approvals and clicks 'Approve & Authorize Outage')*  
> *"For high-risk decisions, the Sovereign Orchestrator enforces a strict Human-in-the-Loop gate. The workflow halts until the Chief Inspection Engineer signs off. Once approved, the cryptographic audit trail records the decision."*

---

### [04:45 – 05:30] IMMUTABLE AUDIT TRAIL
> *"Our audit timeline reconstructs the entire execution: which models ran, which agents executed, which SOPs were cited, what the human authorized, and which files were generated."*

---

### [05:30 – 06:00] PROOF OF ZERO DATA EXFILTRATION & CONCLUSION
> *(Presenter shows the Sovereignty Center and Network Monitor)*  
> *"Finally, here is our cryptographic proof: External AI calls remain strictly at **0**. No cloud APIs. No data leaks. Full institutional control.*  
> *Private intelligence. Autonomous work. Zero data exfiltration. Thank you!"*
