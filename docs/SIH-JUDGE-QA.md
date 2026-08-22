# SIH JUDGE Q&A — 25 DEFENSIVE TECHNICAL QUESTIONS & ANSWERS

**Project:** Sovereign AI Workbench  
**Problem Statement:** Sovereign On-Premise Agentic AI Workbench using Open-Weight Multimodal LLMs for Confidential Industrial Work  
**Organization:** Mangalore Refinery and Petrochemicals Limited (MRPL)  
**Date:** August 22, 2026  

---

### 1. "Why on-premise instead of a private cloud VPC?"
**Answer:** "Refinery assets, NDT thickness logs, and P&ID schematics represent critical national infrastructure (CNI). Even dedicated cloud VPCs introduce data transit risks, third-party dependency, and compliance friction with Indian statutory mandates (OISD/PESO). An on-premise air-gapped system guarantees complete sovereignty and zero data exfiltration."

### 2. "Why use open-weight models?"
**Answer:** "Open-weight models (like NVIDIA Nemotron 3 Nano 4B) can be fully audited, customized, quantized, and hosted locally on refinery hardware without recurring API fees, cloud vendor lock-in, or telemetry leaks."

### 3. "Why multiple models instead of one single large LLM?"
**Answer:** "Specialized tasks require distinct model capabilities. Text reasoning is optimized on Nemotron 3 Nano; OCR and drawing recognition are handled by our Local Multimodal Engine; and script generation is routed to our Local Code Specialist. Routing by task maximizes accuracy while staying strictly within our 4GB GPU budget."

### 4. "Why 100 agents? Isn't that over-engineered?"
**Answer:** "Industrial refineries comprise over a dozen distinct engineering disciplines—NDT inspection, corrosion engineering, HAZOP safety, crude blending, steam balancing, and statutory compliance. Each of our 100 micro-servers embodies specialized domain prompts, RBAC tool permissions, and standard-specific rules."

### 5. "How is automatic model selection performed?"
**Answer:** "Our Model Auto-Router (`platform/models/model-router.js`) inspects incoming attachments and task intent. If an image or PDF scan is detected, it routes to Local Vision/OCR; if code or formula scripting is required, it routes to the Code Specialist; for epistemic synthesis, it routes to Nemotron 3 Nano."

### 6. "How do you prove zero data leaves the machine?"
**Answer:** "We implement an in-process Sovereign Policy Interceptor (`platform/security/sovereign-policy.js`). Any outbound connection outside `127.0.0.1` and private CIDRs is blocked and logged. Our active OS network sniffer verifies **External Calls = 0** throughout all workflow executions."

### 7. "What happens if a model hallucinates a critical safety number?"
**Answer:** "Our Epistemic Reasoner mandates factual grounding in the Local Knowledge Base (RAG). Every conclusion is cross-referenced with official MRPL SOPs (e.g., `SOP-MRPL-INSP-042`) and API-653 standards, returning exact page and section citations. Furthermore, high-impact decisions must pass a Human-in-the-Loop gate."

### 8. "How is Python code executed safely without endangering the host?"
**Answer:** "Code executes in an isolated local sandbox (`platform/sandbox/code-sandbox.js`). Prohibited patterns (path traversal, subprocesses, sockets, `os.system`) are intercepted before execution, and processes are strictly bound by timeouts and memory ceilings."

### 9. "How does the local RAG work without an internet connection?"
**Answer:** "Refinery manuals and OISD standards are pre-indexed into local on-premise vector embeddings and BM25 indices. Retrieval, semantic scoring, and ranking execute entirely in-process on local storage."

### 10. "How do you extract data from noisy, scanned PDFs?"
**Answer:** "Our Local OCR Engine performs layout extraction and tabular coordinate parsing to isolate thickness tables, nominal values, and retirement limits without calling external OCR APIs."

### 11. "Can you process engineering P&ID drawings?"
**Answer:** "Yes. Our Drawing Analyzer parses P&ID schematics to extract equipment tags (`TK-101`, `HX-204`), line specs, instrument tags, and relief valves (`PSV-101A`), verifying safety interlocks."

### 12. "How do agents coordinate without endless loops?"
**Answer:** "Agent 101 acts as the Master Orchestrator, compiling a deterministic Directed Acyclic Graph (DAG) with explicit dependency ordering and step validations."

### 13. "Why is Human-in-the-Loop (HITL) required?"
**Answer:** "In heavy industrial and refinery environments, autonomous execution of critical operations (e.g., shutting down a crude unit or ordering patch welding) is unacceptable without formal human authorization. The AI recommends; the Chief Engineer approves."

### 14. "How do you run this on a modest 4GB VRAM GPU (RTX 2050)?"
**Answer:** "We apply INT4/Q4_K_M quantization to Nemotron 3 Nano (occupying 2.84 GB VRAM) and enforce sequential model concurrency (`MAX_CONCURRENT_MODELS=1`), completely preventing out-of-memory errors."

### 15. "Can MRPL replace or add new open-weight models in the future?"
**Answer:** "Yes. Our Model Registry (`platform/models/model-registry.js`) is fully pluggable. New GGUF, Ollama, or ONNX models can be added by declaring their footprint, modalities, and endpoints."

### 16. "What happens if internet connectivity is completely cut off?"
**Answer:** "The system is built air-gapped by design. 100% of workflows, OCR, RAG, agent coordination, and deliverable generation continue operating normally offline."

### 17. "What is the difference between this and a standard chatbot?"
**Answer:** "A chatbot merely outputs text. The Sovereign AI Workbench is an autonomous workforce that executes multi-agent DAGs, calls permissioned tools, runs sandboxed calculations, grounds in local SOPs, and synthesizes real `.docx`, `.xlsx`, and `.pptx` deliverables with cryptographic audit trails."

### 18. "What real deliverables are generated?"
**Answer:** "Official Word memorandums (`Approval_Note.docx`), structured Excel workbooks (`Inspection_Analysis.xlsx`), and PowerPoint briefing decks (`Management_Briefing.pptx`)."

### 19. "How are conflicting agent findings resolved?"
**Answer:** "When two agents report conflicting severity scores, the Orchestrator marks the step as `CONFLICT_DETECTED` and escalates the evidence delta to human engineering review."

### 20. "What audit trail is maintained?"
**Answer:** "Every user prompt, agent execution, model call, tool invocation, document cited, and human approval decision is logged into an immutable audit ledger (`platform/services/audit-service.js`)."

### 21. "What is the immediate industrial value to MRPL?"
**Answer:** "Eliminates days of manual document parsing and report formulation, ensures 100% compliance with OISD/API statutory limits, and guarantees zero proprietary asset data leaves the refinery."

### 22. "How would MRPL deploy this in production?"
**Answer:** "As a containerized on-premise appliance or localized server inside the refinery's private supervisory network (DMZ), accessible exclusively to authorized plant engineers."

### 23. "What are the known limitations?"
**Answer:** "Complex handwritten cursive annotations with extreme degradation require human visual verification. We intentionally flag ambiguous handwriting with low confidence rather than hallucinating false values."

### 24. "Can the workbench handle high document concurrency?"
**Answer:** "Yes, by queuing tasks through the API Gateway and scheduling inference sequentially to respect hardware VRAM limits."

### 25. "Is the showcase website connected to internal refinery data?"
**Answer:** "No. The public showcase website operates strictly in Showcase Mode using synthetic open data. Sovereign Mode operates in isolation within the air-gapped refinery boundary."
