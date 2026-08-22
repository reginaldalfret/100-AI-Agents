import { InspectionReportAnalysisWorkflow } from "./inspection-report-analysis.js";

export const WORKFLOW_DEFINITIONS = {
  "inspection-report-analysis": InspectionReportAnalysisWorkflow,
  // Additional industrial workflows
  "pid-drawing-review": {
    id: "pid-drawing-review",
    name: "P&ID Schematic & Drawing Integrity Review",
    domain: "Engineering & Process Safety",
    description: "Component tag extraction, safety relief valve verification, and interlock checking from engineering schematics.",
    steps: [
      { id: "drawing-analysis", agent_id: "agent-052", name: "P&ID & Piping Layout Specialist", action: "Extract tags and valves from P&ID drawing" },
      { id: "safety-interlock-check", agent_id: "agent-064", name: "Process Hazard Analysis (HAZOP) Specialist", action: "Verify relief valve sizing and high-level trips" },
      { id: "engineering-signoff", agent_id: "agent-101", name: "Sovereign Orchestrator", action: "Engineering sign-off", is_hitl: true }
    ]
  },
  "safety-compliance-audit": {
    id: "safety-compliance-audit",
    name: "OISD / Statutory Safety Compliance Audit",
    domain: "Regulatory Compliance & Safety",
    description: "Cross-checks refinery asset conditions against OISD-STD-129, PESO tank licenses, and environmental norms.",
    steps: [
      { id: "statutory-rule-search", agent_id: "agent-074", name: "OISD Standard Audit & Compliance Agent", action: "Lookup statutory inspection intervals" },
      { id: "hazard-evaluation", agent_id: "agent-017", name: "Plant Risk SWOT Analysis Agent", action: "Perform risk scoring" },
      { id: "audit-memorandum", agent_id: "agent-049", name: "Technical Report & Deliverable Generator", action: "Generate audit memorandum DOCX" }
    ]
  },
  "vendor-cost-comparison": {
    id: "vendor-cost-comparison",
    name: "Turnaround Spare Parts & Vendor Technical Bid Comparison",
    domain: "Procurement & Cost Optimization",
    description: "Evaluates vendor technical qualifications, compares commercial price schedules, and calculates cost variances in Excel.",
    steps: [
      { id: "vendor-prequal", agent_id: "agent-083", name: "Strategic Vendor Evaluation & Pre-Qual Agent", action: "Verify contractor technical capabilities" },
      { id: "bid-comparison", agent_id: "agent-085", name: "Purchase Order & Technical Bid Comparer", action: "Compare line items and pricing" },
      { id: "spreadsheet-generation", agent_id: "agent-047", name: "Industrial Spreadsheet Analyst", action: "Create structured comparison XLSX" }
    ]
  }
};

export function listWorkflows() {
  return Object.values(WORKFLOW_DEFINITIONS);
}

export function getWorkflow(id) {
  return WORKFLOW_DEFINITIONS[id] || null;
}
