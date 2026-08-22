import { historyEngine } from "../../../platform/evidence/index.js";
import { runTestSuite } from "../harness.js";
import assert from "node:assert";

await runTestSuite("Historical Intelligence & Trend Analysis Tests", [
  {
    name: "Calculates long-term and short-term corrosion rates from multi-year NDT measurements",
    fn: async () => {
      const trend = historyEngine.analyzeTrend("HX-204", 6.80);
      assert.strictEqual(trend.has_sufficient_history, true);
      assert.strictEqual(trend.datapoints_count, 3);
      assert.strictEqual(trend.current_thickness_mm, 5.90);
      assert.strictEqual(trend.retirement_limit_mm, 6.80);
      assert.strictEqual(trend.is_below_retirement_limit, true);
      assert.strictEqual(trend.statutory_deficit_mm, 0.90);
      assert.strictEqual(trend.long_term_corrosion_rate_mm_yr, 0.650);
      assert.strictEqual(trend.short_term_corrosion_rate_mm_yr, 0.900);
      assert.ok(trend.engineering_recommendation.includes("MANDATORY_REPAIR"));
    }
  },
  {
    name: "Records new measurement dynamically and updates trend timeline",
    fn: async () => {
      historyEngine.recordMeasurement("P-301", { year: 2024, thickness_mm: 12.0, standard: "API-610" });
      historyEngine.recordMeasurement("P-301", { year: 2026, thickness_mm: 11.2, standard: "API-610" });

      const trend = historyEngine.analyzeTrend("P-301", 10.0);
      assert.strictEqual(trend.has_sufficient_history, true);
      assert.strictEqual(trend.datapoints_count, 2);
      assert.strictEqual(trend.is_below_retirement_limit, false);
      assert.strictEqual(trend.calculated_remaining_life_years, 3.0);
    }
  }
]);
