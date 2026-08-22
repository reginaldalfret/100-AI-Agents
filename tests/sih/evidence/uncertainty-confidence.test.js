import { evaluateConfidence, computeEvidenceCompleteness } from "../../../platform/evidence/index.js";
import { runTestSuite } from "../harness.js";
import assert from "node:assert";

await runTestSuite("Uncertainty & Calibrated Confidence Tests", [
  {
    name: "Calibrates HIGH confidence when multiple corroborated sources agree with zero conflicts",
    fn: async () => {
      const res = evaluateConfidence({
        sourcesCount: 3,
        conflictsCount: 0,
        hasMissingParams: false,
        imageQuality: "high",
        calculationVerified: true
      });

      assert.strictEqual(res.confidence_level, "HIGH");
      assert.ok(res.score >= 80);
      assert.strictEqual(res.is_calibrated, true);
    }
  },
  {
    name: "Calibrates LOW / MEDIUM confidence and provides explanatory factors when data is missing or conflicting",
    fn: async () => {
      const res = evaluateConfidence({
        sourcesCount: 1,
        conflictsCount: 1,
        hasMissingParams: true,
        imageQuality: "low",
        calculationVerified: false
      });

      assert.strictEqual(res.confidence_level, "LOW");
      assert.ok(res.explanatory_factors.length >= 4);
      assert.ok(res.recommendation.includes("Human-In-The-Loop"));
    }
  },
  {
    name: "Computes evidence completeness score against required inspection checklist",
    fn: async () => {
      const req = ["equipment_id", "thickness_measurement", "oisd_standard", "operating_temp"];
      const avail = ["equipment_id", "thickness_measurement", "oisd_standard"];

      const res = computeEvidenceCompleteness(req, avail);
      assert.strictEqual(res.completeness_percentage, 75);
      assert.strictEqual(res.is_complete, false);
      assert.deepStrictEqual(res.missing_items, ["operating_temp"]);
    }
  }
]);
