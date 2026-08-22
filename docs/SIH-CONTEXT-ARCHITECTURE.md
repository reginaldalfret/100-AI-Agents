# SOVEREIGN AI WORKBENCH — CANONICAL CONTEXT ARCHITECTURE

**System:** Sovereign AI Workbench  
**Theme:** Persistent Multi-Turn Context & Entity Memory  
**Host Environment:** On-Premise (MRPL)  
**Date:** August 22, 2026  

---

## 1. Canonical Context Hierarchy

To avoid fragmented or competing memory stores, the Sovereign AI Workbench enforces a single, authoritative top-down context tree:

```
USER (e.g. Plant Inspector / Safety Officer)
  └── CONVERSATION (Persistent Session on E: Drive)
        └── INVESTIGATION / TASK (Long-Running Objective)
              └── WORKFLOW / PLAN (Dynamic DAG)
                    └── STEP (Single Node Execution)
                          ├── AGENT EXECUTION (Domain Specialist)
                          ├── MODEL CALL (Nemotron / Vision / Code)
                          ├── TOOL CALL (Sandbox / RAG / OCR)
                          └── EVIDENCE (Nodes & Relationships)
                                └── ARTIFACT (.docx / .xlsx / .pptx)
                                      └── APPROVAL (HITL Sign-off)
                                            └── AUDIT (Tamper-evident log)
```

---

## 2. Retention Policies

| Tier | Lifecycle Policy | Storage Location | Example Data |
| :--- | :--- | :--- | :--- |
| **`EPHEMERAL`** | In-Memory (cleared on step finish) | Process RAM | Raw image buffer, token stream |
| **`SESSION`** | Persists across browser refreshes | `data/context/<conv_id>.json` | Active conversation history, user role |
| **`TASK`** | Persists until investigation closes | `data/context/<task_id>.json` | Step outputs, evidence refs, replan count |
| **`LONG_TERM`** | Permanent authoritative record | `data/context/entities.json` | Equipment history, baseline thicknesses |
