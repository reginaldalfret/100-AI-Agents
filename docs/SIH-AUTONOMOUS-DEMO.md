# SOVEREIGN AI WORKBENCH — FLAGSHIP AUTONOMOUS LIVE DEMO WALKTHROUGH

**Target Audience:** Smart India Hackathon (SIH) Evaluators & MRPL Industrial Jury  
**Demo Duration:** 3–5 Minutes  
**Goal:** Prove true multi-agent autonomy, multi-model execution, dynamic replanning, grounded evidence, and zero external egress.  

---

## 1. Live Demonstration Script

### Step 1: Input the Unseen Natural Language Directive
The presenter enters a novel, complex industrial goal:
> *"Analyze this inspection report and photograph, compare findings with local standards, determine if additional data is needed, calculate remaining life, and draft a management briefing."*

### Step 2: Observe Dynamic DAG Decomposition
The UI displays the dynamic step progress:
- ✓ **Step 1:** Ingest scanned ultrasonic thickness PDF & CUI defect photograph (`local-vision-ocr` / `agent-045` & `agent-051`).
- ✓ **Step 2:** Query local vector RAG for OISD-STD-129 & API-653 limits (`nemotron-3-nano` / `agent-093`).
- ✓ **Step 3:** Calculate corrosion rate (0.42 mm/yr) and remaining life (0.0 yrs) in Python sandbox (`local-code-specialist` / `agent-055`).
- ✓ **Step 4 (Replanning):** Detected missing operational temperature $\to$ dynamically searched equipment history $\to$ resumed synthesis.
- ✓ **Step 5:** Multi-Agent engineering risk assessment and Form-B repair recommendation (`nemotron-3-nano` / `agent-101`).
- ✓ **Step 6:** Generate official deliverables: `Approval_Note_HX204.docx`, `Inspection_Analysis_HX204.xlsx`, `Management_Briefing_HX204.pptx`.
- ● **Step 7:** Awaiting authorized Plant Inspector Human-In-The-Loop sign-off.

### Step 3: Verify Sovereignty & Deliverables
1. Click `Approval_Note_HX204.docx` to inspect the generated native Word document with grounded OISD citations.
2. Open the real-time Egress Sniffer: **Total External Network Calls: 0 (100% Air-Gapped)**.
