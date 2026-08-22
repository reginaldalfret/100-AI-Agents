import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const INDUSTRIAL_DOMAINS = [
  "Document Intelligence",
  "Engineering",
  "Inspection & Maintenance",
  "Plant Safety & Hazards",
  "Regulatory Compliance",
  "Refinery Operations",
  "Procurement & Supply Chain",
  "Industrial Finance & Cost",
  "Project Management",
  "Technical Research",
  "Software & Automation Coding",
  "Data Analytics & Telemetry",
  "Knowledge & SOP Management",
  "Technical Communication",
  "Approval & Governance",
  "Sovereign Orchestration"
];

const RAW_DATA = JSON.parse(fs.readFileSync(path.join(ROOT, "registry", "agents.json"), "utf8"));
const RAW_AGENTS = Array.isArray(RAW_DATA) ? RAW_DATA : (RAW_DATA.agents || []);

const SIH_AGENT_ROLES = {
  "agent-001": { role: "Industrial Document Analyst", domain: "Document Intelligence", tools: ["extract_pdf", "ocr_document", "read_file"] },
  "agent-002": { role: "Technical Communication Specialist", domain: "Technical Communication", tools: ["generate_docx", "send_notification"] },
  "agent-003": { role: "SOP Training & Onboarding Agent", domain: "Technical Communication", tools: ["search_knowledge", "read_file"] },
  "agent-004": { role: "Safety Assessment & Quiz Agent", domain: "Plant Safety & Hazards", tools: ["search_knowledge", "calculate_step_by_step"] },
  "agent-005": { role: "Executive Technical Summarizer", domain: "Document Intelligence", tools: ["read_file", "generate_docx"] },
  "agent-006": { role: "Equipment Records & Asset Historian", domain: "Engineering", tools: ["get_asset_history", "read_file"] },
  "agent-007": { role: "Technical Translation & Standards Agent", domain: "Technical Communication", tools: ["read_file", "search_knowledge"] },
  "agent-008": { role: "Hazard Mitigation & Brainstorming Agent", domain: "Plant Safety & Hazards", tools: ["search_knowledge", "assess_risk"] },
  "agent-009": { role: "Incident Investigation Narrative Agent", domain: "Plant Safety & Hazards", tools: ["search_knowledge", "read_file"] },
  "agent-010": { role: "Turnaround & Maintenance Goal Planner", domain: "Engineering", tools: ["calculate_step_by_step", "read_excel"] },

  "agent-011": { role: "Field Log & Shift Handover Agent", domain: "Inspection & Maintenance", tools: ["read_file", "write_file"] },
  "agent-012": { role: "Work Order Task Automation Agent", domain: "Refinery Operations", tools: ["get_work_orders", "update_work_order"] },
  "agent-013": { role: "Contractor Compliance & Qualification Agent", domain: "Regulatory Compliance", tools: ["search_knowledge", "verify_document"] },
  "agent-014": { role: "Maintenance Crew Dispatch & Matching Agent", domain: "Refinery Operations", tools: ["get_crew_schedule", "read_file"] },
  "agent-015": { role: "Safety Interview & Debriefing Agent", domain: "Plant Safety & Hazards", tools: ["read_file", "generate_docx"] },
  "agent-016": { role: "Inter-Departmental Memo Dispatcher", domain: "Technical Communication", tools: ["generate_docx", "read_file"] },
  "agent-017": { role: "Plant Risk SWOT Analysis Agent", domain: "Plant Safety & Hazards", tools: ["search_knowledge", "assess_risk"] },
  "agent-018": { role: "Technical Career & Competency Advisor", domain: "Refinery Operations", tools: ["search_knowledge", "read_file"] },
  "agent-019": { role: "Operational Decision Tree Evaluator", domain: "Refinery Operations", tools: ["calculate_step_by_step", "assess_risk"] },
  "agent-020": { role: "Engineering Innovation & Design Agent", domain: "Engineering", tools: ["search_knowledge", "calculate_step_by_step"] },

  "agent-021": { role: "Local Technical Patent & Literature Agent", domain: "Technical Research", tools: ["search_knowledge", "read_file"] },
  "agent-022": { role: "Industry News & Standards Monitor", domain: "Technical Research", tools: ["search_knowledge", "read_file"] },
  "agent-023": { role: "Petrochemical Research Paper Analyst", domain: "Technical Research", tools: ["extract_pdf", "search_knowledge"] },
  "agent-024": { role: "Refinery Engineering Literature Reviewer", domain: "Technical Research", tools: ["search_knowledge", "read_file"] },
  "agent-025": { role: "Technical Manuals & Codex Agent", domain: "Technical Research", tools: ["search_knowledge", "read_file"] },
  "agent-026": { role: "Vendor Profile & Intelligence Agent", domain: "Procurement & Supply Chain", tools: ["search_knowledge", "read_file"] },
  "agent-027": { role: "Benchmark & Refinery Competitor Analyst", domain: "Technical Research", tools: ["search_knowledge", "read_excel"] },
  "agent-028": { role: "Petrochemical Market Trends Analyst", domain: "Procurement & Supply Chain", tools: ["read_excel", "calculate_step_by_step"] },
  "agent-029": { role: "New Technology & Pilot Evaluator", domain: "Engineering", tools: ["search_knowledge", "assess_risk"] },
  "agent-030": { role: "CAPEX Investment & ROI Analyst", domain: "Industrial Finance & Cost", tools: ["calculate_step_by_step", "read_excel"] },

  "agent-031": { role: "Refinery Product Specification Agent", domain: "Engineering", tools: ["search_knowledge", "read_file"] },
  "agent-032": { role: "Logistics & Fleet Dispatch Optimizer", domain: "Refinery Operations", tools: ["calculate_step_by_step", "read_excel"] },
  "agent-033": { role: "Site Facility & Mess Management Agent", domain: "Refinery Operations", tools: ["read_file", "write_file"] },
  "agent-034": { role: "Technical Curriculum & Training Agent", domain: "Technical Communication", tools: ["search_knowledge", "read_file"] },
  "agent-035": { role: "Engineering Campus & Talent Scout", domain: "Refinery Operations", tools: ["read_file", "search_knowledge"] },
  "agent-036": { role: "Internal Code Repository & Version Agent", domain: "Software & Automation Coding", tools: ["search_files", "read_file"] },
  "agent-037": { role: "Confidential Archive & Dossier Researcher", domain: "Document Intelligence", tools: ["extract_pdf", "ocr_document"] },
  "agent-038": { role: "Technical Fact-Checking & Verification Agent", domain: "Knowledge & SOP Management", tools: ["search_knowledge", "verify_document"] },
  "agent-039": { role: "Source Citation & Provenance Verifier", domain: "Knowledge & SOP Management", tools: ["search_knowledge", "read_file"] },
  "agent-040": { role: "SOP Retrieval & Search Agent", domain: "Knowledge & SOP Management", tools: ["search_knowledge", "read_file"] },

  "agent-041": { role: "Plant Dispatch Communication Agent", domain: "Technical Communication", tools: ["generate_docx", "read_file"] },
  "agent-042": { role: "Shutdown & Maintenance Calendar Agent", domain: "Project Management", tools: ["get_schedule", "read_excel"] },
  "agent-043": { role: "Automation Scripting & Trigger Agent", domain: "Software & Automation Coding", tools: ["execute_python_sandbox", "write_file"] },
  "agent-044": { role: "Secure Archive & File Organizer", domain: "Document Intelligence", tools: ["list_files", "search_files"] },
  "agent-045": { role: "Scanned PDF & Drawing OCR Specialist", domain: "Document Intelligence", tools: ["ocr_document", "extract_pdf", "analyze_image"] },
  "agent-046": { role: "Industrial Invoice & Bill of Quantities Agent", domain: "Industrial Finance & Cost", tools: ["ocr_document", "read_excel", "calculate_step_by_step"] },
  "agent-047": { role: "Industrial Spreadsheet & Telemetry Analyst", domain: "Data Analytics & Telemetry", tools: ["read_excel", "write_excel", "calculate_step_by_step"] },
  "agent-048": { role: "Process Sensor & SCADA Data Analyst", domain: "Data Analytics & Telemetry", tools: ["read_excel", "calculate_step_by_step"] },
  "agent-049": { role: "Technical Report & Deliverable Generator", domain: "Document Intelligence", tools: ["generate_docx", "generate_pdf"] },
  "agent-050": { role: "Plant KPI & Dashboard Visualizer", domain: "Data Analytics & Telemetry", tools: ["read_excel", "generate_pptx"] },

  "agent-051": { role: "Predictive Analytics & Maintenance Forecaster", domain: "Data Analytics & Telemetry", tools: ["read_excel", "calculate_step_by_step"] },
  "agent-052": { role: "P&ID & Piping Layout Specialist", domain: "Engineering", tools: ["analyze_image", "ocr_document", "read_file"] },
  "agent-053": { role: "Pressure Vessel & Piping Thickness Analyst", domain: "Engineering", tools: ["calculate_step_by_step", "read_file"] },
  "agent-054": { role: "Pump & Compressor Vibration Specialist", domain: "Engineering", tools: ["read_excel", "calculate_step_by_step"] },
  "agent-055": { role: "Distillation Column & Thermal Analyst", domain: "Engineering", tools: ["calculate_step_by_step", "search_knowledge"] },
  "agent-056": { role: "Heat Exchanger Fouling & Thermal Agent", domain: "Engineering", tools: ["calculate_step_by_step", "read_file"] },
  "agent-057": { role: "Catalyst Performance & Yield Analyst", domain: "Engineering", tools: ["calculate_step_by_step", "read_excel"] },
  "agent-058": { role: "NDT & Ultrasonic Thickness Inspection Agent", domain: "Inspection & Maintenance", tools: ["ocr_document", "calculate_step_by_step"] },
  "agent-059": { role: "Corrosion Under Insulation (CUI) Specialist", domain: "Inspection & Maintenance", tools: ["analyze_image", "assess_risk"] },
  "agent-060": { role: "Flange Leak & Gasket Integrity Analyst", domain: "Inspection & Maintenance", tools: ["analyze_image", "read_file"] },

  "agent-061": { role: "Storage Tank & Containment Dyke Inspector", domain: "Inspection & Maintenance", tools: ["ocr_document", "calculate_step_by_step"] },
  "agent-062": { role: "Relief Valve (PSV) Testing & Calibration Agent", domain: "Inspection & Maintenance", tools: ["verify_document", "calculate_step_by_step"] },
  "agent-063": { role: "Flare Stack & Emission Monitor", domain: "Inspection & Maintenance", tools: ["read_excel", "assess_risk"] },
  "agent-064": { role: "Process Hazard Analysis (HAZOP) Specialist", domain: "Plant Safety & Hazards", tools: ["search_knowledge", "assess_risk"] },
  "agent-065": { role: "Material Safety Data Sheet (MSDS) Agent", domain: "Document Intelligence", tools: ["search_knowledge", "read_file"] },
  "agent-066": { role: "Permit-to-Work (PTW) Verification Agent", domain: "Plant Safety & Hazards", tools: ["verify_document", "search_knowledge"] },
  "agent-067": { role: "Lockout / Tagout (LOTO) Compliance Inspector", domain: "Plant Safety & Hazards", tools: ["search_knowledge", "verify_document"] },
  "agent-068": { role: "Confined Space Entry Safety Evaluator", domain: "Plant Safety & Hazards", tools: ["search_knowledge", "assess_risk"] },
  "agent-069": { role: "Fire Protection & Deluge System Inspector", domain: "Plant Safety & Hazards", tools: ["search_knowledge", "read_file"] },
  "agent-070": { role: "Gas Detection & Toxic Vapor Monitor", domain: "Plant Safety & Hazards", tools: ["read_excel", "assess_risk"] },

  "agent-071": { role: "Environmental Compliance & Effluent Agent", domain: "Regulatory Compliance", tools: ["read_excel", "search_knowledge"] },
  "agent-072": { role: "Pollution Control Board (CPCB/SPCB) Auditor", domain: "Regulatory Compliance", tools: ["search_knowledge", "verify_document"] },
  "agent-073": { role: "PESO & Statutory Tank License Agent", domain: "Regulatory Compliance", tools: ["verify_document", "search_knowledge"] },
  "agent-074": { role: "OISD Standard Audit & Compliance Agent", domain: "Regulatory Compliance", tools: ["search_knowledge", "assess_risk"] },
  "agent-075": { role: "ISO 14001 / ISO 45001 Compliance Specialist", domain: "Regulatory Compliance", tools: ["search_knowledge", "read_file"] },
  "agent-076": { role: "Internal Audit & Gap Finding Agent", domain: "Regulatory Compliance", tools: ["search_knowledge", "generate_docx"] },
  "agent-077": { role: "Crude Unit Throughput & Blending Optimizer", domain: "Refinery Operations", tools: ["calculate_step_by_step", "read_excel"] },
  "agent-078": { role: "Steam & Power Utility Balance Agent", domain: "Refinery Operations", tools: ["calculate_step_by_step", "read_excel"] },
  "agent-079": { role: "Hydrogen Network & Pressure Balancer", domain: "Refinery Operations", tools: ["calculate_step_by_step", "read_excel"] },
  "agent-080": { role: "Cooling Tower & Water Chemistry Specialist", domain: "Refinery Operations", tools: ["calculate_step_by_step", "read_file"] },

  "agent-081": { role: "Product Dispatch & Tanker Loading Agent", domain: "Refinery Operations", tools: ["get_dispatch_queue", "read_file"] },
  "agent-082": { role: "Pipeline Transfer & Custody Transfer Agent", domain: "Refinery Operations", tools: ["calculate_step_by_step", "verify_document"] },
  "agent-083": { role: "Strategic Vendor Evaluation & Pre-Qual Agent", domain: "Procurement & Supply Chain", tools: ["search_knowledge", "verify_document"] },
  "agent-084": { role: "RFQ & Tender Document Formulation Agent", domain: "Procurement & Supply Chain", tools: ["generate_docx", "read_file"] },
  "agent-085": { role: "Purchase Order & Technical Bid Comparer", domain: "Procurement & Supply Chain", tools: ["read_excel", "calculate_step_by_step"] },
  "agent-086": { role: "Critical Spare Parts & Inventory Optimizer", domain: "Procurement & Supply Chain", tools: ["read_excel", "search_knowledge"] },
  "agent-087": { role: "Chemical Reagents & Catalyst Procurement Agent", domain: "Procurement & Supply Chain", tools: ["read_excel", "search_knowledge"] },
  "agent-088": { role: "Supply Chain Lead Time & Risk Analyst", domain: "Procurement & Supply Chain", tools: ["calculate_step_by_step", "read_excel"] },
  "agent-089": { role: "Refinery OPEX & Maintenance Cost Analyst", domain: "Industrial Finance & Cost", tools: ["calculate_step_by_step", "read_excel"] },
  "agent-090": { role: "Equipment Repair vs Replacement Cost Evaluator", domain: "Industrial Finance & Cost", tools: ["calculate_step_by_step", "read_excel"] },

  "agent-091": { role: "Energy Efficiency & Fuel Loss Accountant", domain: "Industrial Finance & Cost", tools: ["calculate_step_by_step", "read_excel"] },
  "agent-092": { role: "Depreciation & Asset Valuation Specialist", domain: "Industrial Finance & Cost", tools: ["calculate_step_by_step", "read_excel"] },
  "agent-093": { role: "Tariff, Duty & Petrochemical Tax Evaluator", domain: "Industrial Finance & Cost", tools: ["calculate_step_by_step", "read_file"] },
  "agent-094": { role: "Annual Maintenance Budget Reconciler", domain: "Industrial Finance & Cost", tools: ["read_excel", "write_excel"] },
  "agent-095": { role: "Refinery Turnaround Gantt & Schedule Agent", domain: "Project Management", tools: ["read_excel", "calculate_step_by_step"] },
  "agent-096": { role: "Critical Path & Delay Prediction Specialist", domain: "Project Management", tools: ["read_excel", "assess_risk"] },
  "agent-097": { role: "Contractor Manpower & Progress Tracker", domain: "Project Management", tools: ["read_excel", "calculate_step_by_step"] },
  "agent-098": { role: "EPC Project Milestone & Billing Verifier", domain: "Project Management", tools: ["verify_document", "read_excel"] },
  "agent-099": { role: "Plant Commissioning Punchlist Agent", domain: "Project Management", tools: ["read_file", "write_file"] },
  "agent-100": { role: "Executive Project Status Report Generator", domain: "Project Management", tools: ["generate_pptx", "generate_docx"] },

  "agent-101": { role: "Sovereign Orchestrator (Master Planner & DAG Engine)", domain: "Sovereign Orchestration", tools: ["*"] }
};

const sihAgents = RAW_AGENTS.map(agent => {
  const id = agent.agent_id || agent.id;
  const custom = SIH_AGENT_ROLES[id] || {
    role: agent.name || `Industrial Agent ${id}`,
    domain: "Refinery Operations",
    tools: ["read_file", "search_knowledge"]
  };

  return {
    ...agent,
    id: id,
    agent_id: id,
    name: custom.role,
    role: custom.role,
    industrial_role: custom.role,
    domain: custom.domain,
    system_prompt: `You are ${custom.role} (${id}), an expert on-premise industrial AI agent operating within the Sovereign AI Workbench for Mangalore Refinery and Petrochemicals Limited (MRPL). You operate strictly on-premise without external data exfiltration. Base all findings on verified facts and local technical standards.`,
    capabilities: [
      custom.domain.toLowerCase().replace(/[\s&]+/g, "-"),
      ...custom.tools.map(t => t.replace(/_/g, "-")),
      "sovereign-local"
    ],
    primary_tools: custom.tools,
    model_requirements: {
      preferred_model: "nemotron-3-nano",
      fallback_model: "local-dense-4b",
      modalities: custom.tools.includes("analyze_image") || custom.tools.includes("ocr_document") ? ["text", "vision"] : ["text"]
    }
  };
});

fs.writeFileSync(path.join(ROOT, "registry", "sih-agent-mapping.json"), JSON.stringify(sihAgents, null, 2), "utf8");
console.log(`Successfully mapped ${sihAgents.length} agents into registry/sih-agent-mapping.json`);
