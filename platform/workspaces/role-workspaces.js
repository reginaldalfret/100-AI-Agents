/**
 * Sovereign AI Workbench — Role-Based Workspaces & Views
 * Defines authorized operational views and capabilities for Engineer, Safety Officer, Manager, Auditor, and Admin.
 */

export const RoleProfiles = {
  ENGINEER: {
    role: "Engineer",
    title: "Plant Inspection & Reliability Engineer",
    views: ["chat", "investigations", "documents", "technical_analysis", "sandbox"],
    allowed_actions: ["create_investigation", "upload_document", "run_calculation", "export_workbook"]
  },
  SAFETY_OFFICER: {
    role: "Safety Officer",
    title: "HSE & Statutory Safety Officer",
    views: ["chat", "investigations", "compliance_standards", "approvals", "anomalies"],
    allowed_actions: ["sign_approval", "flag_risk", "issue_work_permit", "view_audit_trail"]
  },
  MANAGER: {
    role: "Manager",
    title: "Operations & Refinery General Manager",
    views: ["chat", "executive_briefings", "approvals", "kpi_dashboards"],
    allowed_actions: ["sign_approval", "export_briefing", "view_recommendations"]
  },
  AUDITOR: {
    role: "Auditor",
    title: "Statutory Compliance & Sovereignty Auditor",
    views: ["audit_ledger", "provenance_graph", "sovereignty_monitor", "evidence_packages"],
    allowed_actions: ["export_evidence_package", "verify_cryptographic_signatures", "view_network_logs"]
  },
  ADMIN: {
    role: "Administrator",
    title: "AI Platform & Model Administrator",
    views: ["models", "agents", "security", "connectors", "scheduler", "evaluation"],
    allowed_actions: ["load_model", "unload_model", "trigger_benchmark", "configure_connectors"]
  }
};

export function getWorkspaceForRole(roleName = "Engineer") {
  const normalized = String(roleName).toUpperCase().replace(/\s+/g, "_");
  return RoleProfiles[normalized] || RoleProfiles.ENGINEER;
}
