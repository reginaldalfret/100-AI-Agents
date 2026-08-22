# SOVEREIGN AI WORKBENCH — AGENT & MODEL MAPPING MATRIX

**Organization:** Mangalore Refinery and Petrochemicals Limited (MRPL)  
**Total Workforce:** 101 Industrial Agents (100 Domain Specialists + Agent 101 Master Orchestrator)  

---

| Industrial Domain | Agent Range | Primary Preferred Model | Secondary / Fallback | Operational Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **NDT & Asset Integrity** | `agent-045`, `agent-058` | **Gemma 3 / Vision Engine** | Nemotron 3 Nano | Image parsing of ultrasonic thickness grids and pipe scans |
| **Piping & P&ID Drawings** | `agent-052`, `agent-064` | **Gemma 3 / Vision Engine** | Nemotron 3 Nano | Component tag isolation and safety relief valve verification |
| **HAZOP & Safety Standards** | `agent-017`, `agent-074` | **NVIDIA Nemotron 3 Nano** | Local RAG | Epistemic reasoning against OISD-STD-129 and PESO rules |
| **Code, Formulas & Sandbox** | `agent-055`, `agent-056` | **Qwen2.5-Coder** | Local Sandbox | Python corrosion rate scripting and SCADA data processing |
| **Procurement & Bids** | `agent-083`, `agent-085` | **NVIDIA Nemotron 3 Nano** | Qwen2.5-Coder | Commercial terms comparison and technical vendor pre-qual |
| **Master Orchestration** | `agent-101` | **NVIDIA Nemotron 3 Nano** | Rule Engine | Multi-step DAG planning, agent dispatch, and HITL governance |
