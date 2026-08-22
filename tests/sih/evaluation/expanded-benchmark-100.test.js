import { aiEvaluationEngine } from "../../../platform/evaluation/index.js";
import { runTestSuite } from "../harness.js";
import assert from "node:assert";

await runTestSuite("Expanded 100-Scenario Autonomous Industrial Benchmark", [
  {
    name: "Evaluates 100 industrial scenarios across all 5 domains with >=98% plan validity & zero egress",
    fn: async () => {
      const report = await aiEvaluationEngine.runFullEvaluation();
      assert.strictEqual(report.total_scenarios, 100);
      assert.strictEqual(report.passed_count, 100);
      assert.strictEqual(report.failed_count, 0);
      assert.strictEqual(report.pass_rate_percentage, 100.0);
      assert.strictEqual(report.plan_validity_percentage, 100.0);
      assert.strictEqual(report.external_network_egress_calls, 0);
      assert.strictEqual(report.regression_detected, false);
    }
  }
]);
