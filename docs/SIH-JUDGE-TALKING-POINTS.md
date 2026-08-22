# SIH JUDGE TALKING POINTS — SOVEREIGN AI WORKBENCH

**Problem Statement:** Sovereign On-Premise Agentic AI Workbench using Open-Weight Multimodal LLMs for Confidential Industrial Work  
**Organization:** Mangalore Refinery and Petrochemicals Limited (MRPL)  

---

## 1. STRATEGIC DEFENSE & KEY TALKING POINTS

### Q1: "How do you prove zero data leaves the machine during inference?"
- **Answer:** "Our application implements a mandatory in-process Sovereign Policy Interceptor (`platform/security/sovereign-policy.js`). Any socket or HTTP connection outside `127.0.0.1` and private CIDRs is blocked before reaching the network interface. We provide an active OS-level connection audit proving **External Calls = 0** throughout full workflow execution."

### Q2: "Can you run multimodal tasks on limited GPU hardware (RTX 2050 4GB)?"
- **Answer:** "Yes. We designed a Local Model Auto-Router with dynamic quantization (Q4_K_M) and bounded concurrency (`MAX_CONCURRENT_MODELS=1`). Text reasoning runs on Nemotron 3 Nano (2.84 GB VRAM), while OCR and vision run in-process using lightweight ONNX/Int8 pipelines, operating comfortably within 4GB VRAM without memory thrashing."

### Q3: "Is this just an LLM chat wrapper, or does it do autonomous work?"
- **Answer:** "This is an autonomous 100-agent industrial workforce. Agent 101 acts as a Sovereign Orchestrator that parses industrial goals, generates a multi-step DAG, invokes specialized agents (NDT Thickness, P&ID Drawing Specialist, SOP Search), executes Python calculations in an isolated sandbox, and synthesizes real `.docx`, `.xlsx`, and `.pptx` deliverables."

### Q4: "How do you prevent hallucinations in critical safety operations?"
- **Answer:** "All engineering conclusions are grounded in the Local Knowledge Base (RAG) containing official MRPL SOPs, OISD standards, and API-653 specs. Every finding includes exact document, page, and section citations with epistemic evidence verification."

### Q5: "What happens if an agent suggests a dangerous action?"
- **Answer:** "High-impact decisions (e.g. emergency outages, patch welding, derating) trigger a mandatory Human-in-the-Loop (HITL) gate. The workflow halts in `pending_approval` state until authorized by the designated Chief Inspection Engineer or General Manager."
