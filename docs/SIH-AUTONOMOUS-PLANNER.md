# SOVEREIGN AI WORKBENCH — AUTONOMOUS TASK PLANNER & REPLANNER

**System:** Sovereign AI Workbench  
**Theme:** Smart Automation / Industrial Sovereign AI  
**Deployment Target:** Mangalore Refinery and Petrochemicals Limited (MRPL)  
**Date:** August 22, 2026  

---

## 1. Executive Summary

The **Autonomous Task Planner & Replanner** elevates the Sovereign AI Workbench beyond static, predefined workflows into a truly autonomous, self-healing, multi-agent cognitive system. When presented with previously unseen industrial directives, the engine decomposes the natural language goal into a Directed Acyclic Graph (DAG), dynamically assigns the optimal local open-weight model and specialist agent to each node, monitors intermediate outcomes, detects data deficits and conflicts, and replans execution in real time without human micromanagement or cloud telemetry.

```
                           USER DIRECTIVE
                                 │
                                 ▼
                     CHOOSE EXECUTION STRATEGY
                      /                     \
        [Explicit Workflow]             [Unseen Goal]
                │                             │
                ▼                             ▼
        Workflow Engine              AUTONOMOUS PLANNER
     (Deterministic SOP)                      │
                                              ▼
                                   STRUCTURED TASK DAG
                                              │
                                              ▼
                                   LOCAL MODEL & AGENT ROUTER
                           (Nemotron / Gemma-Vision / Qwen Coder)
                                              │
                                              ▼
                                      DAG STEP RUNNER
                                              │
                                              ▼
                                   RESULT INSPECTION & VALIDATION
                                       /              \
                           [Missing / Conflict]   [Valid Output]
                                     │                  │
                                     ▼                  ▼
                                 REPLANNER          HITL GATE
                             (Bounded Max = 3)          │
                                     │                  ▼
                                     └──────────►  DELIVERABLES
                                              (.docx / .xlsx / .pptx)
```

---

## 2. Canonical Task State Model

Each autonomous execution session instantiates an immutable state ledger:

```json
{
  "task_id": "AUTO-1724300000-042",
  "trace_id": "AUTO-1724300000-042",
  "goal": "Analyze inspection report and photograph, calculate remaining life, and prepare briefing",
  "execution_strategy": "AUTONOMOUS_PLAN",
  "plan": [
    {
      "step_id": "step-1",
      "name": "Document Ingestion & NDT Thickness Extraction",
      "preferred_model": "local-vision-ocr",
      "preferred_agent": "agent-045-pdf-processing-agent",
      "status": "completed"
    },
    {
      "step_id": "step-2",
      "name": "Statutory Standards & SOP Retrieval",
      "preferred_model": "nemotron-3-nano",
      "preferred_agent": "agent-093-rag-knowledge-agent",
      "status": "completed"
    },
    {
      "step_id": "step-3",
      "name": "Corrosion Rate & Remaining Life Calculation",
      "preferred_model": "local-code-specialist",
      "preferred_agent": "agent-055-code-review-agent",
      "status": "completed"
    }
  ],
  "evidence": [
    { "doc_id": "NDT-UT-HX204-2026", "citation": "Nozzle N3 thickness: 5.90 mm" },
    { "doc_id": "OISD-STD-129", "citation": "Mandatory retirement limit: 6.80 mm" }
  ],
  "missing_information": [],
  "conflicts": [],
  "replan_count": 0,
  "max_replans": 3,
  "status": "completed",
  "sovereignty_proof": { "total_external_calls": 0, "is_air_gapped": true }
}
```

---

## 3. Dynamic Model & Agent Allocation

| Step Modality / Subtask | Preferred Local Model | Allocated Specialist Agent | Local Capability |
| :--- | :--- | :--- | :--- |
| **Scanned NDT PDF & P&ID Drawings** | `local-vision-ocr` (Gemma 3 4B / ONNX) | `agent-045-pdf-processing-agent` | Optical Character Recognition & Defect Segmentation |
| **SOP Search & Statutory Standards** | `nemotron-3-nano` (4B Q4_K_M) | `agent-093-rag-knowledge-agent` | Local Vector RAG & OISD / API Citation Retrieval |
| **Corrosion Formulas & Python Math**| `local-code-specialist` (Qwen 1.5B/3B) | `agent-055-code-review-agent` | Isolated Code Sandbox Execution |
| **Epistemic Engineering Synthesis** | `nemotron-3-nano` (4B Q4_K_M) | `agent-101-master-agent` | Multi-Agent Cross-Correlation & Risk Formulation |
| **Official Deliverables Authoring** | `nemotron-3-nano` (4B Q4_K_M) | `agent-049-report-generation-agent` | Native Word (.docx), Excel (.xlsx), Slides (.pptx) |

---

## 4. Autonomous Replanning & Self-Healing Guards

1. **Missing Data Detection:** When critical variables (such as operating temperature or installation year) are absent, the replanner dynamically inserts a historical equipment search step rather than hallucinating plausible values.
2. **Evidence Conflict Detection:** Discrepancies between historical databases and fresh NDT readings (e.g. 6.80 mm vs 5.90 mm) trigger an automatic audit flag and escalate to Human-In-The-Loop review.
3. **Bounded Replan Invariant:** Replanning is strictly bounded to `MAX_REPLANS = 3` to prevent non-terminating loop scenarios.
4. **Agent & Resource Fallback:** If a domain specialist is unavailable, the planner gracefully reassigns the subtask to `agent-101-master-agent` without process termination.
