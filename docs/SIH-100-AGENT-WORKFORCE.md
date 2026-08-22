# SIH MRPL SOVEREIGN AI WORKBENCH — 100-AGENT INDUSTRIAL WORKFORCE

**Client / Organization:** Mangalore Refinery and Petrochemicals Limited (MRPL)  
**System:** Sovereign AI Workbench  
**Workforce Size:** 100 Specialized Industrial Agents + 1 Sovereign Master Orchestrator (Agent 101)  
**Execution Environment:** Air-gapped / On-Premise / Zero Data Exfiltration  
**Date:** August 22, 2026  

---

## 1. WORKFORCE TAXONOMY & DOMAIN ARCHITECTURE

The 100 specialized AI agents are organized into 16 core industrial domains mapped directly to refinery, petrochemical, and heavy manufacturing workflows:

```
                                  [ SOVEREIGN ORCHESTRATOR ]
                                         (Agent 101)
                                              │
         ┌────────────────────────────────────┼────────────────────────────────────┐
         ▼                                    ▼                                    ▼
[ DOCUMENT & MULTIMODAL ]             [ ENGINEERING & NDT ]               [ PLANT SAFETY & HAZOP ]
• Document Analyst (001)             • Equipment Historian (006)          • Hazard Mitigation (008)
• Summarizer (005)                   • Turnaround Planner (010)           • Incident Narrative (009)
• Confidential Archive (037)         • Innovation & Design (020)          • Risk SWOT Agent (017)
• Archive Organizer (044)            • Pilot Evaluator (029)              • HAZOP Specialist (064)
• Scanned PDF/OCR (045)              • Product Specs (031)                • MSDS Agent (065)
• Technical Deliverables (049)       • P&ID Specialist (052)              • Permit-to-Work (066)
• MSDS Extraction (065)              • Vessel Thickness (053)             • LOTO Inspector (067)
                                     • Vibration Specialist (054)         • Confined Space (068)
                                     • Distillation Column (055)          • Fire & Deluge (069)
                                     • Heat Exchanger (056)               • Gas & Vapor Monitor (070)
                                     • Catalyst Yield (057)
                                     • NDT Ultrasonic (058)
                                     • CUI Specialist (059)
                                     • Flange Integrity (060)
                                     • Tank Inspector (061)
                                     • PSV Relief Valve (062)
                                     • Flare Emission (063)

         ┌────────────────────────────────────┼────────────────────────────────────┐
         ▼                                    ▼                                    ▼
[ REFINERY OPERATIONS ]              [ PROCUREMENT & SUPPLY CHAIN ]       [ FINANCE & BUDGETING ]
• Shift Handover (011)               • Vendor Intelligence (026)          • CAPEX ROI Analyst (030)
• Work Order Dispatch (012)          • Market Trends (028)                • Invoice / BOQ Agent (046)
• Crew Dispatch (014)                • Pre-Qual Evaluator (083)           • OPEX Cost Analyst (089)
• Decision Tree Evaluator (019)      • RFQ & Tender Formulator (084)      • Repair vs Replace (090)
• Logistics & Fleet (032)            • Purchase Order Comparer (085)      • Fuel Loss Accountant (091)
• Site Facilities (033)              • Spare Parts Inventory (086)        • Asset Depreciation (092)
• Crude Blending (077)               • Chemical Reagents (087)            • Tariff & Tax Evaluator (093)
• Utility Balance (078)              • Lead Time Analyst (088)            • Annual Budget Reconciler (094)
• Hydrogen Network (079)
• Cooling Tower (080)
• Tanker Loading (081)
• Pipeline Custody (082)

         ┌────────────────────────────────────┼────────────────────────────────────┐
         ▼                                    ▼                                    ▼
[ REGULATORY COMPLIANCE ]            [ KNOWLEDGE & LOCAL RAG ]            [ DATA & AUTOMATION ]
• Contractor Compliance (013)        • Fact-Checking (038)                • Code Repo Agent (036)
• Environmental Effluent (071)       • Provenance Verifier (039)          • Python Sandbox Scripting (043)
• CPCB / SPCB Auditor (072)          • SOP Retrieval (040)                • Telemetry Spreadsheet (047)
• PESO Tank Licensing (073)          • Patent & Literature (021)          • SCADA Data Analyst (048)
• OISD Standard Audit (074)          • Standards Monitor (022)            • KPI Dashboard (050)
• ISO 14001 / 45001 (075)            • Petrochemical Papers (023)         • Predictive Forecaster (051)
• Internal Gap Audit (076)           • Literature Review (024)
                                     • Technical Codex (025)
```

---

## 2. COMPLETE 101-AGENT DIRECTORY MATRIX

| Agent ID | Port | Industrial Role | Capability Domain | Primary Tools | Model Requirement |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `agent-001` | 8101 | Industrial Document Analyst | Document Intelligence | `extract_pdf`, `ocr_document`, `read_file` | Text / Vision |
| `agent-002` | 8102 | Technical Communication Specialist | Technical Communication | `generate_docx`, `send_notification` | Text |
| `agent-003` | 8103 | SOP Training & Onboarding Agent | Technical Communication | `search_knowledge`, `read_file` | Text |
| `agent-004` | 8104 | Safety Assessment & Quiz Agent | Plant Safety & Hazards | `search_knowledge`, `calculate_step_by_step` | Text |
| `agent-005` | 8105 | Executive Technical Summarizer | Document Intelligence | `read_file`, `generate_docx` | Text |
| `agent-006` | 8106 | Equipment Records & Asset Historian | Engineering | `get_asset_history`, `read_file` | Text |
| `agent-007` | 8107 | Technical Translation & Standards Agent | Technical Communication | `read_file`, `search_knowledge` | Text |
| `agent-008` | 8108 | Hazard Mitigation & Brainstorming Agent | Plant Safety & Hazards | `search_knowledge`, `assess_risk` | Text |
| `agent-009` | 8109 | Incident Investigation Narrative Agent | Plant Safety & Hazards | `search_knowledge`, `read_file` | Text |
| `agent-010` | 8110 | Turnaround & Maintenance Goal Planner | Engineering | `calculate_step_by_step`, `read_excel` | Text |
| `agent-011` | 8111 | Field Log & Shift Handover Agent | Inspection & Maintenance | `read_file`, `write_file` | Text |
| `agent-012` | 8112 | Work Order Task Automation Agent | Refinery Operations | `get_work_orders`, `update_work_order` | Text |
| `agent-013` | 8113 | Contractor Compliance & Qualification Agent | Regulatory Compliance | `search_knowledge`, `verify_document` | Text |
| `agent-014` | 8114 | Maintenance Crew Dispatch & Matching Agent | Refinery Operations | `get_crew_schedule`, `read_file` | Text |
| `agent-015` | 8115 | Safety Interview & Debriefing Agent | Plant Safety & Hazards | `read_file`, `generate_docx` | Text |
| `agent-016` | 8116 | Inter-Departmental Memo Dispatcher | Technical Communication | `generate_docx`, `read_file` | Text |
| `agent-017` | 8117 | Plant Risk SWOT Analysis Agent | Plant Safety & Hazards | `search_knowledge`, `assess_risk` | Text |
| `agent-018` | 8118 | Technical Career & Competency Advisor | Refinery Operations | `search_knowledge`, `read_file` | Text |
| `agent-019` | 8119 | Operational Decision Tree Evaluator | Refinery Operations | `calculate_step_by_step`, `assess_risk` | Text |
| `agent-020` | 8120 | Engineering Innovation & Design Agent | Engineering | `search_knowledge`, `calculate_step_by_step` | Text |
| `agent-021` | 8121 | Local Technical Patent & Literature Agent | Technical Research | `search_knowledge`, `read_file` | Text |
| `agent-022` | 8122 | Industry News & Standards Monitor | Technical Research | `search_knowledge`, `read_file` | Text |
| `agent-023` | 8123 | Petrochemical Research Paper Analyst | Technical Research | `extract_pdf`, `search_knowledge` | Text |
| `agent-024` | 8124 | Refinery Engineering Literature Reviewer | Technical Research | `search_knowledge`, `read_file` | Text |
| `agent-025` | 8125 | Technical Manuals & Codex Agent | Technical Research | `search_knowledge`, `read_file` | Text |
| `agent-026` | 8126 | Vendor Profile & Intelligence Agent | Procurement & Supply Chain | `search_knowledge`, `read_file` | Text |
| `agent-027` | 8127 | Benchmark & Refinery Competitor Analyst | Technical Research | `search_knowledge`, `read_excel` | Text |
| `agent-028` | 8128 | Petrochemical Market Trends Analyst | Procurement & Supply Chain | `read_excel`, `calculate_step_by_step` | Text |
| `agent-029` | 8129 | New Technology & Pilot Evaluator | Engineering | `search_knowledge`, `assess_risk` | Text |
| `agent-030` | 8130 | CAPEX Investment & ROI Analyst | Industrial Finance & Cost | `calculate_step_by_step`, `read_excel` | Text |
| `agent-031` | 8131 | Refinery Product Specification Agent | Engineering | `search_knowledge`, `read_file` | Text |
| `agent-032` | 8132 | Logistics & Fleet Dispatch Optimizer | Refinery Operations | `calculate_step_by_step`, `read_excel` | Text |
| `agent-033` | 8133 | Site Facility & Mess Management Agent | Refinery Operations | `read_file`, `write_file` | Text |
| `agent-034` | 8134 | Technical Curriculum & Training Agent | Technical Communication | `search_knowledge`, `read_file` | Text |
| `agent-035` | 8135 | Engineering Campus & Talent Scout | Refinery Operations | `read_file`, `search_knowledge` | Text |
| `agent-036` | 8136 | Internal Code Repository & Version Agent | Software & Automation Coding | `search_files`, `read_file` | Text / Code |
| `agent-037` | 8137 | Confidential Archive & Dossier Researcher | Document Intelligence | `extract_pdf`, `ocr_document` | Text / Vision |
| `agent-038` | 8138 | Technical Fact-Checking & Verification Agent | Knowledge & SOP Management | `search_knowledge`, `verify_document` | Text |
| `agent-039` | 8139 | Source Citation & Provenance Verifier | Knowledge & SOP Management | `search_knowledge`, `read_file` | Text |
| `agent-040` | 8140 | SOP Retrieval & Search Agent | Knowledge & SOP Management | `search_knowledge`, `read_file` | Text |
| `agent-041` | 8141 | Plant Dispatch Communication Agent | Technical Communication | `generate_docx`, `read_file` | Text |
| `agent-042` | 8142 | Shutdown & Maintenance Calendar Agent | Project Management | `get_schedule`, `read_excel` | Text |
| `agent-043` | 8143 | Automation Scripting & Trigger Agent | Software & Automation Coding | `execute_python_sandbox`, `write_file` | Code |
| `agent-044` | 8144 | Secure Archive & File Organizer | Document Intelligence | `list_files`, `search_files` | Text |
| `agent-045` | 8145 | Scanned PDF & Drawing OCR Specialist | Document Intelligence | `ocr_document`, `extract_pdf`, `analyze_image` | Vision / OCR |
| `agent-046` | 8146 | Industrial Invoice & Bill of Quantities Agent | Industrial Finance & Cost | `ocr_document`, `read_excel`, `calculate_step_by_step` | Vision / Math |
| `agent-047` | 8147 | Industrial Spreadsheet & Telemetry Analyst | Data Analytics & Telemetry | `read_excel`, `write_excel`, `calculate_step_by_step` | Data / Math |
| `agent-048` | 8148 | Process Sensor & SCADA Data Analyst | Data Analytics & Telemetry | `read_excel`, `calculate_step_by_step` | Data |
| `agent-049` | 8149 | Technical Report & Deliverable Generator | Document Intelligence | `generate_docx`, `generate_pdf` | Text |
| `agent-050` | 8150 | Plant KPI & Dashboard Visualizer | Data Analytics & Telemetry | `read_excel`, `generate_pptx` | Data / Presentation |
| `agent-051` | 8151 | Predictive Analytics & Maintenance Forecaster | Data Analytics & Telemetry | `read_excel`, `calculate_step_by_step` | Data |
| `agent-052` | 8152 | P&ID & Piping Layout Specialist | Engineering | `analyze_image`, `ocr_document`, `read_file` | Vision / Diagram |
| `agent-053` | 8153 | Pressure Vessel & Piping Thickness Analyst | Engineering | `calculate_step_by_step`, `read_file` | Math / Engineering |
| `agent-054` | 8154 | Pump & Compressor Vibration Specialist | Engineering | `read_excel`, `calculate_step_by_step` | Math / Engineering |
| `agent-055` | 8155 | Distillation Column & Thermal Analyst | Engineering | `calculate_step_by_step`, `search_knowledge` | Thermal / Physics |
| `agent-056` | 8156 | Heat Exchanger Fouling & Thermal Agent | Engineering | `calculate_step_by_step`, `read_file` | Thermal / Physics |
| `agent-057` | 8157 | Catalyst Performance & Yield Analyst | Engineering | `calculate_step_by_step`, `read_excel` | Chemistry / Math |
| `agent-058` | 8158 | NDT & Ultrasonic Thickness Inspection Agent | Inspection & Maintenance | `ocr_document`, `calculate_step_by_step` | Vision / NDT |
| `agent-059` | 8159 | Corrosion Under Insulation (CUI) Specialist | Inspection & Maintenance | `analyze_image`, `assess_risk` | Vision / Inspection |
| `agent-060` | 8160 | Flange Leak & Gasket Integrity Analyst | Inspection & Maintenance | `analyze_image`, `read_file` | Vision / Inspection |
| `agent-061` | 8161 | Storage Tank & Containment Dyke Inspector | Inspection & Maintenance | `ocr_document`, `calculate_step_by_step` | Inspection / NDT |
| `agent-062` | 8162 | Relief Valve (PSV) Testing & Calibration Agent | Inspection & Maintenance | `verify_document`, `calculate_step_by_step` | Calibration / Safety |
| `agent-063` | 8163 | Flare Stack & Emission Monitor | Inspection & Maintenance | `read_excel`, `assess_risk` | Telemetry / Safety |
| `agent-064` | 8164 | Process Hazard Analysis (HAZOP) Specialist | Plant Safety & Hazards | `search_knowledge`, `assess_risk` | Safety / HAZOP |
| `agent-065` | 8165 | Material Safety Data Sheet (MSDS) Agent | Document Intelligence | `search_knowledge`, `read_file` | Chemistry / Safety |
| `agent-066` | 8166 | Permit-to-Work (PTW) Verification Agent | Plant Safety & Hazards | `verify_document`, `search_knowledge` | Governance / Safety |
| `agent-067` | 8167 | Lockout / Tagout (LOTO) Compliance Inspector | Plant Safety & Hazards | `search_knowledge`, `verify_document` | Safety / LOTO |
| `agent-068` | 8168 | Confined Space Entry Safety Evaluator | Plant Safety & Hazards | `search_knowledge`, `assess_risk` | Safety / Atmospheric |
| `agent-069` | 8169 | Fire Protection & Deluge System Inspector | Plant Safety & Hazards | `search_knowledge`, `read_file` | Safety / Fire |
| `agent-070` | 8170 | Gas Detection & Toxic Vapor Monitor | Plant Safety & Hazards | `read_excel`, `assess_risk` | Gas / Chemical |
| `agent-071` | 8171 | Environmental Compliance & Effluent Agent | Regulatory Compliance | `read_excel`, `search_knowledge` | Environmental |
| `agent-072` | 8172 | Pollution Control Board (CPCB/SPCB) Auditor | Regulatory Compliance | `search_knowledge`, `verify_document` | Statutory / Audit |
| `agent-073` | 8173 | PESO & Statutory Tank License Agent | Regulatory Compliance | `verify_document`, `search_knowledge` | Statutory / Licensing |
| `agent-074` | 8174 | OISD Standard Audit & Compliance Agent | Regulatory Compliance | `search_knowledge`, `assess_risk` | Oil Industry Safety |
| `agent-075` | 8175 | ISO 14001 / ISO 45001 Compliance Specialist | Regulatory Compliance | `search_knowledge`, `read_file` | International Standards |
| `agent-076` | 8176 | Internal Audit & Gap Finding Agent | Regulatory Compliance | `search_knowledge`, `generate_docx` | Audit / Governance |
| `agent-077` | 8177 | Crude Unit Throughput & Blending Optimizer | Refinery Operations | `calculate_step_by_step`, `read_excel` | Optimization / Linear |
| `agent-078` | 8178 | Steam & Power Utility Balance Agent | Refinery Operations | `calculate_step_by_step`, `read_excel` | Utility Balancing |
| `agent-079` | 8179 | Hydrogen Network & Pressure Balancer | Refinery Operations | `calculate_step_by_step`, `read_excel` | Gas Network |
| `agent-080` | 8180 | Cooling Tower & Water Chemistry Specialist | Refinery Operations | `calculate_step_by_step`, `read_file` | Water Chemistry |
| `agent-081` | 8181 | Product Dispatch & Tanker Loading Agent | Refinery Operations | `get_dispatch_queue`, `read_file` | Logistics |
| `agent-082` | 8182 | Pipeline Transfer & Custody Transfer Agent | Refinery Operations | `calculate_step_by_step`, `verify_document` | Custody / Fiscal |
| `agent-083` | 8183 | Strategic Vendor Evaluation & Pre-Qual Agent | Procurement & Supply Chain | `search_knowledge`, `verify_document` | Vendor Governance |
| `agent-084` | 8184 | RFQ & Tender Document Formulation Agent | Procurement & Supply Chain | `generate_docx`, `read_file` | Commercial / Tender |
| `agent-085` | 8185 | Purchase Order & Technical Bid Comparer | Procurement & Supply Chain | `read_excel`, `calculate_step_by_step` | Commercial / Bid |
| `agent-086` | 8186 | Critical Spare Parts & Inventory Optimizer | Procurement & Supply Chain | `read_excel`, `search_knowledge` | Inventory / MRO |
| `agent-087` | 8187 | Chemical Reagents & Catalyst Procurement Agent | Procurement & Supply Chain | `read_excel`, `search_knowledge` | Procurement |
| `agent-088` | 8188 | Supply Chain Lead Time & Risk Analyst | Procurement & Supply Chain | `calculate_step_by_step`, `read_excel` | Supply Chain |
| `agent-089` | 8189 | Refinery OPEX & Maintenance Cost Analyst | Industrial Finance & Cost | `calculate_step_by_step`, `read_excel` | Cost Accounting |
| `agent-090` | 8190 | Equipment Repair vs Replacement Cost Evaluator | Industrial Finance & Cost | `calculate_step_by_step`, `read_excel` | Asset Lifecycle |
| `agent-091` | 8191 | Energy Efficiency & Fuel Loss Accountant | Industrial Finance & Cost | `calculate_step_by_step`, `read_excel` | Energy Accounting |
| `agent-092` | 8192 | Depreciation & Asset Valuation Specialist | Industrial Finance & Cost | `calculate_step_by_step`, `read_excel` | Financial Asset |
| `agent-093` | 8193 | Tariff, Duty & Petrochemical Tax Evaluator | Industrial Finance & Cost | `calculate_step_by_step`, `read_file` | Taxation / Customs |
| `agent-094` | 8194 | Annual Maintenance Budget Reconciler | Industrial Finance & Cost | `read_excel`, `write_excel` | Budgeting |
| `agent-095` | 8195 | Refinery Turnaround Gantt & Schedule Agent | Project Management | `read_excel`, `calculate_step_by_step` | Scheduling / Gantt |
| `agent-096` | 8196 | Critical Path & Delay Prediction Specialist | Project Management | `read_excel`, `assess_risk` | Critical Path / CPM |
| `agent-097` | 8197 | Contractor Manpower & Progress Tracker | Project Management | `read_excel`, `calculate_step_by_step` | Manpower / Earned Value |
| `agent-098` | 8198 | EPC Project Milestone & Billing Verifier | Project Management | `verify_document`, `read_excel` | Contract / Billing |
| `agent-099` | 8199 | Plant Commissioning Punchlist Agent | Project Management | `read_file`, `write_file` | Commissioning |
| `agent-100` | 8200 | Executive Project Status Report Generator | Project Management | `generate_pptx`, `generate_docx` | Executive Reporting |
| `agent-101` | 8201 | Sovereign Orchestrator (Master Planner & DAG Engine) | Sovereign Orchestration | `*` (All Local Tools) | Multi-Model Orchestration |

---

## 3. SUMMARY
All 101 agents maintain 100% backward-compatible HTTP micro-server interfaces, port allocations, and contract schemas, while providing deep specialized industrial intelligence for MRPL confidential operations.
