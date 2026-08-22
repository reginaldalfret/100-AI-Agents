import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { executeDAGPlan, detectEvidenceConflicts, routeRequest } from "../platform/intelligence/index.js";

describe("Nemotron Intelligence V1 — Multi-Agent DAG & Conflict Detection Tests", () => {
  test("1. Executes multi-agent DAG plan sequentially and satisfies dependencies", async () => {
    const route = routeRequest("Check the student's academic record and determine whether they qualify financially for the scholarship.");
    assert.equal(route.mode, "multi_agent_dag");

    const exec = await executeDAGPlan(route.plan, {
      entities: { studentId: "STU-1001", student_id: "STU-1001", document_id: "DOC-8001" }
    });

    assert.equal(exec.success, true);
    assert.ok(exec.evidenceLedger.length >= 2);
  });

  test("2. Detects evidence conflict between document report and finance database", () => {
    const conflictingEvidence = [
      { source: "DocumentAgent:IncomeCertificate", data: { annualIncome: 120000 } },
      { source: "FinanceService:DatabaseLedger", data: { annualIncome: 180000 } }
    ];

    const conflicts = detectEvidenceConflicts(conflictingEvidence);
    assert.equal(conflicts.length, 1);
    assert.equal(conflicts[0].type, "INCOME_DISCREPANCY");
    assert.ok(conflicts[0].message.includes("120000"));
    assert.ok(conflicts[0].message.includes("180000"));
  });
});
