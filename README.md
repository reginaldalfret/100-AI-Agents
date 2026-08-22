# Super AI

### Sovereign On-Premise Agentic AI Workbench

> **Super AI** is the user-facing product powered by the **Sovereign AI Workbench** architecture using Open-Weight Multimodal LLMs for Confidential Industrial Work.  
> **Target Organization:** Mangalore Refinery and Petrochemicals Limited (MRPL)  
> **Environment:** 100% Air-Gapped / On-Premise Execution (Zero External Cloud Telemetry)  

---

## 🌟 Executive Overview

**Super AI** (powered by the **Sovereign AI Workbench** architecture) is an enterprise on-premise industrial AI operating platform. Built specifically for high-security refinery operations at MRPL, it unifies **Super AI (Agent 101 Orchestrator)**, **100 specialized industrial agents**, a **Hardware-Aware Multi-Model Router**, an **Autonomous Task Planner & Replanner**, a **Multimodal Document Pipeline**, an **Evidence Relationship Graph**, and a **Local Deliverables Engine** into a single cohesive, air-gapped system.

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

## 🚀 Key Capabilities

### 1. 🛡️ Absolute Sovereignty & Zero Egress
- **100% Air-Gapped:** Operates entirely on local hardware with zero external API calls (`0` external cloud egress).
- **Strict Egress Monitor:** Hard kernel-level loopback enforcement blocking all outbound telemetry and public IPs.

### 2. 🧠 Tri-Model Local Intelligence
- **NVIDIA Nemotron 3 Nano (4B Q4_K_M):** Primary reasoning, epistemic synthesis, and autonomous task orchestration.
- **Local Vision & OCR (Gemma 3 / ONNX):** Scanned NDT reports, P&ID schematics, and site defect photographs.
- **Qwen2.5-Coder (1.5B / 3B):** Local Python sandbox scripting, corrosion calculations, and tabular parsing.

### 3. 👥 101-Agent Industrial Workforce
- **100 Domain Specialists:** Chemical engineering, rotating equipment, piping, metallurgy, HSE, instrumentation, etc.
- **Agent 101 Master Orchestrator:** Dynamic intent classification, capability matching, and multi-agent coordination.

### 4. 🔄 Autonomous Planning & Self-Healing Replanner
- **Dynamic DAG Generation:** Decomposes unseen natural language objectives into dependency graphs.
- **Self-Healing Replanner:** Detects missing data, reconciles evidence conflicts, substitutes unavailable agents, and enforces `MAX_REPLANS = 3`.

### 5. 📊 Evidence Graph & Provenance
- **Typed Relationships:** `SUPPORTS`, `CONTRADICTS`, `DERIVED_FROM`, `REFERS_TO`, `SUPERSEDES`.
- **Source Authority Hierarchy:** $\text{OISD / Statutory SOP (100)} > \text{Technical Spec (80)} > \text{NDT Report (70)} > \text{History (50)}$.
- **6-State Epistemic Uncertainty:** `FACT`, `INFERENCE`, `MISSING`, `CONFLICT`, `UNCERTAIN`, `ESTIMATE`.

### 6. 📄 Official Deliverables Engine
- **Native Word (.docx):** Statutory Approval Notes & Work Permits.
- **Native Excel (.xlsx):** Detailed multi-year ultrasonic thickness workbooks.
- **Native PowerPoint (.pptx):** Executive slide decks with grounded standard citations.

---

## 🛠️ Local Hardware Profile

- **GPU:** NVIDIA RTX 2050 (4GB VRAM)
- **System Memory:** 8GB RAM
- **Operating System:** Windows / Linux
- **Local Inference Host:** Ollama (`127.0.0.1:11434`)
- **Authoritative Storage:** `E:\Smart Automation\` (100% portable)

---

## 🚦 Quick Start Guide

### 1. Clone & Configure Environment
```powershell
# Copy environment configuration
cp .env.example .env

# Set storage environment variables
$env:OLLAMA_MODELS = "E:\Smart Automation\AI\Models\Ollama"
```

### 2. Install Local Models
```powershell
# Pull open-weight local models via Ollama
ollama pull nemotron-3-nano
ollama pull qwen2.5-coder:1.5b
```

### 3. Start Local Fleet & Gateway
```powershell
# Launch 101 agents and central gateway
.\scripts\start-local-fleet.ps1
```

Access the Sovereign AI Workbench Web UI at `http://localhost:8300`.

---

## 🧪 Comprehensive Verification Suite

```powershell
# Run the 101-Agent Fleet Verification
node tests/run-all-agents.js --concurrency=10
# Output: 101/101 Passed (100.0%)

# Run the Full SIH Platform Test Matrix (24 Suites / 75 Tests)
node tests/sih/run-all-tests.js
# Output: ALL 24 TEST SUITES PASSED (100% PASS RATE, 0 EXTERNAL CALLS)

# Run the 100-Scenario Autonomous Industrial Benchmark
node tests/sih/evaluation/expanded-benchmark-100.test.js
# Output: 100/100 Scenarios Evaluated (100.0% Plan Validity)
```

---

## 📚 Complete SIH Documentation Index

- [`docs/SIH-GAP-CLOSURE-FINAL-REPORT.md`](docs/SIH-GAP-CLOSURE-FINAL-REPORT.md) — Comprehensive Platform Acceptance Report
- [`docs/SIH-AUTONOMOUS-PLANNER.md`](docs/SIH-AUTONOMOUS-PLANNER.md) — Autonomous Planner & Replanner Architecture
- [`docs/SIH-GAP-CLOSURE-BENCHMARK.md`](docs/SIH-GAP-CLOSURE-BENCHMARK.md) — 100-Scenario Golden Benchmark Report
- [`docs/SIH-CONTEXT-ARCHITECTURE.md`](docs/SIH-CONTEXT-ARCHITECTURE.md) — Canonical Context & Persistence Architecture
- [`docs/SIH-INVESTIGATION-MODE.md`](docs/SIH-INVESTIGATION-MODE.md) — Industrial Investigation Mode & Provenance
- [`docs/SIH-EVIDENCE-GRAPH.md`](docs/SIH-EVIDENCE-GRAPH.md) — Evidence Graph & Relationship Engine
- [`docs/SIH-HISTORICAL-INTELLIGENCE.md`](docs/SIH-HISTORICAL-INTELLIGENCE.md) — Corrosion Trend & Degradation Analytics
- [`docs/SIH-UNCERTAINTY-CONFIDENCE.md`](docs/SIH-UNCERTAINTY-CONFIDENCE.md) — Epistemic Uncertainty & Confidence Scoring
- [`docs/SIH-HITL-EVIDENCE-BUNDLES.md`](docs/SIH-HITL-EVIDENCE-BUNDLES.md) — Human-In-The-Loop Governance
- [`docs/SIH-AUTOMATION.md`](docs/SIH-AUTOMATION.md) — Local Event Bus & Scheduler
- [`docs/SIH-CONNECTORS.md`](docs/SIH-CONNECTORS.md) — Private Local Connectors & Data Classification

---

## 🔒 Security & Air-Gap Compliance

- **Zero Cloud Leakage:** All inference, embeddings, and vector stores run on `127.0.0.1`.
- **RBAC Policy:** 30+ industrial tools protected with agent capability allowlists.
- **Isolated Code Sandbox:** Python/Node scripts run in restricted execution sandboxes without network access.
- **Mandatory HITL:** Safety-critical actions require explicit human sign-off before downstream execution.

---
*Developed for Smart India Hackathon (SIH) — Mangalore Refinery and Petrochemicals Limited (MRPL).*
