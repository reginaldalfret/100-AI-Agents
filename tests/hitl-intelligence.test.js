import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { classifyActionRisk, evaluateHITLRequirement, ActionRiskLevels } from "../platform/intelligence/index.js";

describe("Nemotron Intelligence V1 — HITL Risk Policy Tests", () => {
  test("1. Read/Audit actions are classified as low risk without requiring HITL", () => {
    const policy = classifyActionRisk("get_student_profile");
    assert.equal(policy.level, "low");
    assert.equal(policy.hitl_required, false);

    const hitl = evaluateHITLRequirement({ action: "get_student_profile", risk: "low" });
    assert.equal(hitl.requires_hitl, false);
    assert.equal(hitl.authorized, true);
  });

  test("2. Scholarship disbursement and fee changes are classified as high risk requiring HITL", () => {
    const policy = classifyActionRisk("disburse_scholarship_ledger");
    assert.equal(policy.level, "high");
    assert.equal(policy.hitl_required, true);

    const hitl = evaluateHITLRequirement({ action: "disburse_scholarship_ledger", risk: "high", userRole: "ai_agent" });
    assert.equal(hitl.requires_hitl, true);
    assert.equal(hitl.authorized, false);
    assert.ok(hitl.message.includes("Human-In-The-Loop"));
  });

  test("3. Committee / Administrator role authorizes high-risk actions", () => {
    const hitl = evaluateHITLRequirement({ action: "disburse_scholarship_ledger", risk: "high", userRole: "committee" });
    assert.equal(hitl.requires_hitl, true);
    assert.equal(hitl.authorized, true);
  });
});
