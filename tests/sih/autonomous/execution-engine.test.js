import { executeAutonomousTask } from "../../../platform/intelligence/execution-engine.js";
import { runTestSuite } from "../harness.js";
import assert from "node:assert";

await runTestSuite("Autonomous Execution Engine Tests", [
  {
    name: "Executes Unseen Complex Industrial Task with Full Evidence Synthesis",
    fn: async () => {
      const result = await executeAutonomousTask(
        "Analyze this inspection report and photo, compare finding with local procedures, calculate remaining life in python, and draft management briefing",
        [{ name: "scan.pdf" }, { name: "defect.jpg" }],
        { auto_approve: true }
      );

      assert.strictEqual(result.status, "completed");
      assert.strictEqual(result.strategy, "AUTONOMOUS_PLAN");
      assert.ok(result.evidence.length >= 2);
      assert.ok(result.artifacts.length >= 3);
      assert.strictEqual(result.sovereignty_proof.total_external_calls, 0);
      assert.strictEqual(result.sovereignty_proof.is_air_gapped, true);
    }
  },
  {
    name: "Executes End-to-End Autonomous Replan Flow when missing data is encountered",
    fn: async () => {
      const result = await executeAutonomousTask(
        "Assess nozzle risk and remaining life",
        [{ name: "scan.pdf" }],
        { auto_approve: true, simulate_missing_data: true }
      );

      assert.strictEqual(result.status, "completed");
      assert.strictEqual(result.replan_count, 1);
      assert.ok(result.missing_information.length >= 1);
      assert.strictEqual(result.sovereignty_proof.total_external_calls, 0);
    }
  },
  {
    name: "Executes Agent Failure Recovery and Fallback Substitution",
    fn: async () => {
      const result = await executeAutonomousTask(
        "Perform visual and ultrasonic inspection audit",
        [{ name: "scan.pdf" }],
        { auto_approve: true, simulate_agent_failure: true }
      );

      assert.strictEqual(result.status, "completed");
      assert.strictEqual(result.replan_count, 1);
    }
  },
  {
    name: "Pauses at Human-In-The-Loop Sign-Off Checkpoint when not auto-approved",
    fn: async () => {
      const result = await executeAutonomousTask(
        "Perform statutory inspection review on crude tank HX-204",
        [{ name: "scan.pdf" }],
        { auto_approve: false }
      );

      assert.strictEqual(result.status, "waiting_for_approval");
      assert.ok(result.artifacts.length >= 1);
    }
  }
]);
