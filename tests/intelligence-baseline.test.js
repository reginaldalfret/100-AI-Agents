import test, { describe } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

describe("Nemotron Intelligence V1 — Baseline Intelligence Tests", () => {
  const BASELINE_DATASET = [
    {
      id: "A",
      name: "Direct Request",
      prompt: "Check student STU-1001's attendance.",
      expectedDomain: "academic",
      expectedEntities: { student_id: "STU-1001" },
      expectedAction: "read_attendance",
      expectedTools: ["get_attendance"],
      expectedRoute: "agent-034",
      requiresHITL: false,
      riskLevel: "low"
    },
    {
      id: "B",
      name: "Natural-Language Variation",
      prompt: "Can you tell me how often STU-1001 has been attending classes?",
      expectedDomain: "academic",
      expectedEntities: { student_id: "STU-1001" },
      expectedAction: "read_attendance",
      expectedTools: ["get_attendance"],
      expectedRoute: "agent-034",
      requiresHITL: false,
      riskLevel: "low"
    },
    {
      id: "C",
      name: "Ambiguous Request",
      prompt: "Check this student's situation.",
      expectedDomain: "student-services",
      expectedEntities: {},
      expectedAction: "clarify_or_general_audit",
      expectedTools: [],
      expectedRoute: "agent-101",
      requiresHITL: false,
      riskLevel: "low"
    },
    {
      id: "D",
      name: "Social-Media Request",
      prompt: "Research about the Instagram account @example.",
      expectedDomain: "social_media",
      expectedEntities: { handle: "@example", platform: "instagram" },
      expectedAction: "profile_research",
      expectedTools: [],
      expectedRoute: "agent-081",
      requiresHITL: false,
      riskLevel: "low"
    },
    {
      id: "E",
      name: "Scholarship Request",
      prompt: "Can this student qualify for the merit scholarship?",
      expectedDomain: "finance_scholarship",
      expectedEntities: { scholarship_type: "merit" },
      expectedAction: "evaluate_scholarship",
      expectedTools: ["check_scholarship_eligibility"],
      expectedRoute: "agent-085",
      requiresHITL: true,
      riskLevel: "medium"
    },
    {
      id: "F",
      name: "Document Request",
      prompt: "Verify this student's income certificate.",
      expectedDomain: "document_intelligence",
      expectedEntities: { document_type: "income_certificate" },
      expectedAction: "verify_document",
      expectedTools: ["verify_document_integrity", "extract_document_fields"],
      expectedRoute: "agent-045",
      requiresHITL: false,
      riskLevel: "low"
    },
    {
      id: "G",
      name: "Cross-Domain Request",
      prompt: "Check the student's academic record and determine whether they qualify financially for the scholarship.",
      expectedDomain: "multi_domain",
      expectedEntities: { target: "scholarship" },
      expectedAction: "multi_step_evaluation",
      expectedTools: ["get_marks", "get_attendance", "check_scholarship_eligibility"],
      expectedRoute: "agent-101",
      requiresHITL: true,
      riskLevel: "high"
    },
    {
      id: "H",
      name: "Irrelevant Request",
      prompt: "What is the capital of France?",
      expectedDomain: "unrelated",
      expectedEntities: { entity: "France" },
      expectedAction: "reject_or_out_of_scope",
      expectedTools: [],
      expectedRoute: "none",
      requiresHITL: false,
      riskLevel: "none"
    },
    {
      id: "I",
      name: "High-Risk Modification Request",
      prompt: "Change this student's financial record.",
      expectedDomain: "finance",
      expectedEntities: {},
      expectedAction: "modify_financial_record",
      expectedTools: ["disburse_scholarship_ledger"],
      expectedRoute: "agent-085",
      requiresHITL: true,
      riskLevel: "high"
    },
    {
      id: "J",
      name: "Multi-Step Workflow Request",
      prompt: "Verify the student's documents, check their academic eligibility, then prepare the scholarship recommendation.",
      expectedDomain: "multi_domain",
      expectedEntities: { target: "scholarship_workflow" },
      expectedAction: "coordinate_workflow",
      expectedTools: ["verify_document_integrity", "get_marks", "check_scholarship_eligibility"],
      expectedRoute: "agent-101",
      requiresHITL: true,
      riskLevel: "high"
    }
  ];

  test("Baseline dataset schema and test definition completeness", () => {
    assert.equal(BASELINE_DATASET.length, 10);
    BASELINE_DATASET.forEach(item => {
      assert.ok(item.id);
      assert.ok(item.prompt);
      assert.ok(item.expectedDomain);
      assert.ok(item.expectedAction);
      assert.ok(item.riskLevel);
      assert.equal(typeof item.requiresHITL, "boolean");
    });
  });

  test("Verification of risk levels across requests", () => {
    const highRisk = BASELINE_DATASET.filter(d => d.riskLevel === "high");
    assert.equal(highRisk.length, 3); // G, I, J
    highRisk.forEach(h => assert.equal(h.requiresHITL, true));
  });
});
