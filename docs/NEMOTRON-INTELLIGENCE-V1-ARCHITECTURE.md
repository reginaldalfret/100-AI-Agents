# NEMOTRON INTELLIGENCE UPGRADE V1 — ARCHITECTURE SPECIFICATION

**Project:** SA-S03 — Automated Educational Workflow Management Platform  
**Model:** NVIDIA Nemotron 3 Nano 4B Q4_K_M (Local via Ollama on port 11434)  
**Hardware Profile:** NVIDIA RTX 2050 (4GB VRAM), 8GB System RAM  
**Branch:** `feature/nemotron-intelligence-v1`  
**Status:** In-Development (Tier-1 Upgrade)  

---

## 1. Current Intelligence Architecture & Flow

### Baseline Flow
```
USER REQUEST
    │
    ▼
API GATEWAY (:8300) ── /api/chat or /api/agent
    │
    ├─► If Master (Agent 101):
    │      │
    │      ├─► capability-gate.js (checkCapability)
    │      ├─► planner.js (createPlan via Nemotron)
    │      ├─► delegator.js (delegateMany to HTTP / in-process specialists)
    │      └─► synthesizer.js (synthesize combined answer)
    │
    └─► If Specialist (Agent 001–100):
           │
           ├─► capability-gate.js (4-state gate)
           ├─► agent.js (direct single-pass LLM prompt)
           └─► model.js (generateWithOllama)
```

### Current Limitations Identified
1. **Unstructured Intent Extraction:** Intent was evaluated primarily through static keywords and token matching rather than a structured semantic intent extractor.
2. **Disconnected Tool Reasoning:** Tool calling was executed outside the LLM reasoning loop in workflows, rather than dynamically determined by Nemotron based on evidence requirements.
3. **Absence of Epistemic Distinctions:** The LLM prompt lacked explicit grounding rules separating `FACT` (verified database/service record), `INFERENCE` (logical deduction from facts), and `UNKNOWN` (missing or unverified data), risking data fabrication.
4. **Single-Level Delegation:** Master Agent 101 lacked explicit DAG graph execution, multi-agent conflict detection, and structured risk classification for Human-In-The-Loop (HITL) actions.
5. **Context Splitting:** Workflow state, document metadata, student context, and chat history were scattered across different endpoints without a unified context container.

---

## 2. Target Tier-1 Intelligence Architecture

```
                                USER REQUEST
                                     │
                             [ API GATEWAY ]
                                     │
                    [ PLATFORM INTELLIGENCE LAYER ]
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
[ 1. INTENT ENGINE ]       [ 2. ROUTER & SCORE ]       [ 3. HITL POLICY ]
 • Goal & Domain            • Multi-factor scoring      • Risk Classification
 • Action & Entities        • Candidate selection       • Approval Gateway
 • Risk & HITL Flag         • Task decomposition        • Conflict Detection
        │                            │                            │
        └────────────────────────────┼────────────────────────────┘
                                     │
                        [ 4. CONTEXT CONTAINER ]
                         • conversation_id / workflow_id
                         • student_id & entity bindings
                         • prior results & verified facts
                                     │
                     [ 5. ORCHESTRATOR / AGENT 101 ]
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         │                                                       │
  [ DIRECT REASONING ]                                [ MULTI-AGENT DAG ]
   • Nemotron 3 Nano                                   • Parallel Specialists
   • Epistemic separation                              • Evidence Collection
     (FACT / INFERENCE / UNKNOWN)                      • Result Aggregation
         │                                                       │
         └───────────────────────────┬───────────────────────────┘
                                     │
                        [ 6. STRUCTURED TOOL CALLER ]
                         • Parameter validation
                         • RBAC Allowlist enforcement
                         • Tool result interpretation
                         • Anti-hallucination fallback
                                     │
                         [ 7. AUDIT & TRACE LOG ]
                          • Trace ID (INT-YYYY-XXXXXX)
                          • Structured decision record
```

---

## 3. Modular File Structure Plan

### New Modules to Create (`platform/intelligence/`):
1. [`platform/intelligence/intent-engine.js`](file:///E:/Smart%20Automation/100-AI-Agents/platform/intelligence/intent-engine.js): Semantic goal/domain/action/entity parser with risk classification.
2. [`platform/intelligence/router.js`](file:///E:/Smart%20Automation/100-AI-Agents/platform/intelligence/router.js): Multi-factor agent routing and task decomposition engine.
3. [`platform/intelligence/tool-caller.js`](file:///E:/Smart%20Automation/100-AI-Agents/platform/intelligence/tool-caller.js): Structured tool invocation, parameter validation, and RBAC verification.
4. [`platform/intelligence/reasoner.js`](file:///E:/Smart%20Automation/100-AI-Agents/platform/intelligence/reasoner.js): Grounded reasoning engine separating FACT, INFERENCE, and UNKNOWN.
5. [`platform/intelligence/coordinator.js`](file:///E:/Smart%20Automation/100-AI-Agents/platform/intelligence/coordinator.js): Multi-agent DAG execution and conflict detection.
6. [`platform/intelligence/hitl-policy.js`](file:///E:/Smart%20Automation/100-AI-Agents/platform/intelligence/hitl-policy.js): Action risk classification and human approval gating.
7. [`platform/intelligence/context-manager.js`](file:///E:/Smart%20Automation/100-AI-Agents/platform/intelligence/context-manager.js): Unified request context and trace container.
8. [`platform/intelligence/prompt-builder.js`](file:///E:/Smart%20Automation/100-AI-Agents/platform/intelligence/prompt-builder.js): Modular prompt constructor for Nemotron 3 Nano.
9. [`platform/intelligence/index.js`](file:///E:/Smart%20Automation/100-AI-Agents/platform/intelligence/index.js): Clean public interface for the intelligence platform.

### Test Suites to Create (`tests/`):
- `tests/intelligence-baseline.test.js`: Baseline assessment across 10 request types (A–J).
- `tests/intelligence-routing.test.js`: Routing and decomposition verification.
- `tests/tool-calling.test.js`: Tool execution, validation, RBAC, and error recovery.
- `tests/evidence-reasoning.test.js`: Fact/inference separation and anti-hallucination verification.
- `tests/multi-agent.test.js`: Multi-agent DAG execution and conflict detection.
- `tests/hitl-intelligence.test.js`: High-risk action gating and approval lifecycle.

---

## 4. Stability & Scope Governance

### Files that will Change:
- `agents/agent-101-master-agent/backend/src/` (Orchestration upgrades)
- `platform/gateway/src/server.js` (Intelligence layer integration)

### Files that MUST Remain Untouched:
- `platform/web/ui-polish.css` and visual layout
- Workflow definitions (`platform/workflow-engine/definitions/`)
- Institutional database services (`platform/services/`)
- Cloudflare Tunnel and Supervisor configuration
