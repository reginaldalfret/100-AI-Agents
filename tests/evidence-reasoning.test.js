import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { synthesizeEpistemicFindings, formatGroundedAnswer, EpistemicType } from "../platform/intelligence/index.js";

describe("Nemotron Intelligence V1 — Evidence Grounding & Epistemic Reasoning Tests", () => {
  test("1. Distinguishes FACT from INFERENCE when all evidence is present", () => {
    const facts = [
      { attribute: "cgpa", value: 8.4, source: "AcademicService" },
      { attribute: "attendance", value: 92, source: "AcademicService" },
      { attribute: "income", value: 120000, source: "FinanceService" }
    ];

    const rules = [
      {
        name: "Merit Academic Standard",
        check: (fList) => {
          const cgpa = fList.find(f => f.attribute === "cgpa")?.value;
          return { evaluated: true, satisfied: cgpa >= 8.0, reasoning: `CGPA ${cgpa} meets minimum threshold of 8.0`, evidence_used: ["cgpa"] };
        }
      },
      {
        name: "Attendance Clearance",
        check: (fList) => {
          const att = fList.find(f => f.attribute === "attendance")?.value;
          return { evaluated: true, satisfied: att >= 75, reasoning: `Attendance ${att}% meets 75% requirement`, evidence_used: ["attendance"] };
        }
      }
    ];

    const findings = synthesizeEpistemicFindings({ facts, rules });
    assert.equal(findings.is_fully_grounded, true);
    assert.equal(findings.facts.length, 3);
    assert.equal(findings.inferences.length, 2);
    assert.equal(findings.unknowns.length, 0);
  });

  test("2. Flags UNKNOWN when required institutional data is missing without fabricating", () => {
    const facts = [
      { attribute: "cgpa", value: 8.4, source: "AcademicService" }
    ];

    const rules = [
      {
        name: "Income Eligibility",
        check: (fList) => {
          const inc = fList.find(f => f.attribute === "income")?.value;
          if (inc === undefined) return { evaluated: false, missing_data: "income" };
          return { evaluated: true, satisfied: inc <= 250000, reasoning: `Income ₹${inc} within limit` };
        }
      }
    ];

    const findings = synthesizeEpistemicFindings({ facts, rules });
    assert.equal(findings.is_fully_grounded, false);
    assert.equal(findings.unknowns.length, 1);
    assert.equal(findings.unknowns[0].parameter, "income");

    const answer = formatGroundedAnswer({
      task: "Check scholarship eligibility",
      findings,
      hitlRequirement: { requires_hitl: true }
    });

    assert.equal(answer.status, "incomplete_data");
    assert.ok(answer.answer.includes("income"));
  });
});
