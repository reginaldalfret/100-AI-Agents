/**
 * SA-S03 Platform — Human-In-The-Loop (HITL) Policy & Gating Layer
 * Enforces risk classification and human sign-off for critical institutional decisions.
 */

export const ActionRiskLevels = Object.freeze({
  READ: { level: "low", hitl_required: false },
  ANALYZE: { level: "medium", hitl_required: false },
  RECOMMEND: { level: "medium", hitl_required: true },
  MODIFY_RECORD: { level: "high", hitl_required: true },
  DISBURSE_FUNDS: { level: "high", hitl_required: true },
  AWARD_SCHOLARSHIP: { level: "high", hitl_required: true },
  GRADUATION_CLEARANCE: { level: "high", hitl_required: true },
  COURSE_OVERRIDE: { level: "high", hitl_required: true },
  DELETE_RECORD: { level: "high", hitl_required: true }
});

export function classifyActionRisk(actionName, payload = {}) {
  const name = String(actionName || "").toUpperCase();

  if (name.includes("DISBURSE") || name.includes("AWARD") || name.includes("FINANCIAL_MODIFICATION")) {
    return ActionRiskLevels.DISBURSE_FUNDS;
  }
  if (name.includes("GRADUATION") || name.includes("DEGREE_CLEARANCE")) {
    return ActionRiskLevels.GRADUATION_CLEARANCE;
  }
  if (name.includes("OVERRIDE") || name.includes("PREREQUISITE_OVERRIDE")) {
    return ActionRiskLevels.COURSE_OVERRIDE;
  }
  if (name.includes("MODIFY") || name.includes("UPDATE") || name.includes("DELETE") || name.includes("CHANGE")) {
    return ActionRiskLevels.MODIFY_RECORD;
  }
  if (name.includes("SCHOLARSHIP") || name.includes("RECOMMENDATION") || name.includes("ELIGIBILITY")) {
    return ActionRiskLevels.RECOMMEND;
  }
  if (name.includes("ANALYZE") || name.includes("AUDIT") || name.includes("EVALUATE")) {
    return ActionRiskLevels.ANALYZE;
  }

  return ActionRiskLevels.READ;
}

export function evaluateHITLRequirement({ action, risk, intent, userRole = "ai_agent" }) {
  const policy = classifyActionRisk(action);
  const requiresHITL = policy.hitl_required || risk === "high" || risk === "medium";

  return {
    requires_hitl: requiresHITL,
    risk_level: policy.level,
    authorized: !requiresHITL || userRole === "administrator" || userRole === "committee",
    message: requiresHITL
      ? `Action '${action}' requires formal Human-In-The-Loop committee review and cryptographic sign-off before modification.`
      : `Action '${action}' is authorized for autonomous read/audit execution.`,
    context_required: [
      "decision_summary",
      "evidence_sources",
      "participating_agents",
      "risk_factors"
    ]
  };
}
