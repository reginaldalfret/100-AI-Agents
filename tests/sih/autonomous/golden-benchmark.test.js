import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createPlan, chooseExecutionStrategy, validatePlan } from "../../../platform/intelligence/task-planner.js";
import { runTestSuite } from "../harness.js";
import assert from "node:assert";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(fs.readFileSync(path.join(__dirname, "scenarios-dataset.json"), "utf8"));

await runTestSuite("Autonomous 50-Scenario Golden Benchmark", [
  {
    name: "Evaluates all 50 industrial task scenarios with 100% plan validity",
    fn: async () => {
      let passed = 0;

      for (const sc of scenarios) {
        const strat = chooseExecutionStrategy(sc.goal);
        assert.strictEqual(strat.strategy, sc.expected_strategy, `Strategy mismatch for ${sc.id}`);

        if (strat.strategy === "AUTONOMOUS_PLAN") {
          const taskState = createPlan(sc.goal);
          const validation = validatePlan(taskState);
          assert.strictEqual(validation.valid, true, `Plan invalid for ${sc.id}: ${validation.errors.join(", ")}`);
          assert.ok(taskState.plan.length >= 3, `Plan too short for ${sc.id}`);
        }

        passed++;
      }

      assert.strictEqual(passed, 50, "All 50 scenarios must evaluate successfully");
    }
  }
]);
