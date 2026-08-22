import { createPlan, chooseExecutionStrategy, validatePlan } from "../../../platform/intelligence/task-planner.js";
import { runTestSuite } from "../harness.js";
import assert from "node:assert";

await runTestSuite("Autonomous Task Planner Tests", [
  {
    name: "Chooses EXISTING_WORKFLOW for explicit workflow request",
    fn: async () => {
      const decision = chooseExecutionStrategy("run standard inspection workflow");
      assert.strictEqual(decision.strategy, "EXISTING_WORKFLOW");
    }
  },
  {
    name: "Chooses AUTONOMOUS_PLAN for unseen arbitrary goal",
    fn: async () => {
      const decision = chooseExecutionStrategy("Analyze this inspection report and photograph, compare findings with local procedures, calculate remaining life and draft briefing");
      assert.strictEqual(decision.strategy, "AUTONOMOUS_PLAN");
    }
  },
  {
    name: "Dynamically constructs a valid multi-step DAG with dependencies",
    fn: async () => {
      const taskState = createPlan("Analyze inspection scan and compute corrosion rate in python", [{ name: "scan.pdf" }]);
      assert.ok(taskState.plan.length >= 5);
      assert.ok(taskState.selected_agents.length >= 3);
      assert.ok(taskState.selected_models.includes("local-vision-ocr"));
      assert.ok(taskState.selected_models.includes("nemotron-3-nano"));
      assert.ok(taskState.selected_models.includes("local-code-specialist"));

      const validation = validatePlan(taskState);
      assert.strictEqual(validation.valid, true);
    }
  },
  {
    name: "Enforces Human-In-The-Loop on high-risk industrial actions",
    fn: async () => {
      const taskState = createPlan("Perform emergency crude tank nozzle structural risk assessment");
      assert.strictEqual(taskState.requires_hitl, true);
      assert.ok(taskState.plan.some(s => s.requires_hitl));
    }
  }
]);
