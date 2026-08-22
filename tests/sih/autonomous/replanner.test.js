import { createPlan } from "../../../platform/intelligence/task-planner.js";
import { generateReplan, detectMissingInformation, detectEvidenceConflicts, ReplanTrigger } from "../../../platform/intelligence/replanner.js";
import { TaskStatus } from "../../../platform/intelligence/task-state.js";
import { runTestSuite } from "../harness.js";
import assert from "node:assert";

await runTestSuite("Autonomous Replanner & Recovery Tests", [
  {
    name: "Detects missing operational parameters without hallucination",
    fn: async () => {
      const taskState = createPlan("Assess remaining life and risk of HX-204 nozzle");
      const missing = detectMissingInformation(taskState, {});
      assert.ok(missing.some(m => m.field === "operating_temperature"));
    }
  },
  {
    name: "Detects evidence conflicts between historical records and live scans",
    fn: async () => {
      const taskState = createPlan("Assess remaining life");
      taskState.evidence.push({ source: "historical_db", thickness_mm: 6.80 });
      const conflicts = detectEvidenceConflicts(taskState, { source: "current_ndt", thickness_mm: 5.90 });
      assert.strictEqual(conflicts.length, 1);
      assert.strictEqual(conflicts[0].requires_hitl, true);
    }
  },
  {
    name: "Dynamically inserts information search step on missing data",
    fn: async () => {
      const taskState = createPlan("Assess remaining life of HX-204");
      const initialLength = taskState.plan.length;
      const res = generateReplan(taskState, {
        type: ReplanTrigger.MISSING_INFORMATION,
        missing: [{ field: "operating_temperature", reason: "stress factor" }],
        equipment_id: "HX-204"
      });
      assert.strictEqual(res.success, true);
      assert.strictEqual(taskState.replan_count, 1);
      assert.ok(taskState.plan.some(s => s.name.includes("Historical Equipment Record Search")));
    }
  },
  {
    name: "Substitutes unavailable specialist agent with local orchestrator",
    fn: async () => {
      const taskState = createPlan("Review inspection findings");
      const stepToFail = taskState.plan[0].step_id;
      const res = generateReplan(taskState, {
        type: ReplanTrigger.AGENT_UNAVAILABLE,
        step_id: stepToFail,
        fallback_agent: "agent-101-master-agent",
        fallback_model: "nemotron-3-nano"
      });
      assert.strictEqual(res.success, true);
      const modifiedStep = taskState.plan.find(s => s.step_id === stepToFail);
      assert.strictEqual(modifiedStep.preferred_agent, "agent-101-master-agent");
    }
  },
  {
    name: "Enforces hard bounded replan limit (MAX_REPLANS = 3) to prevent loops",
    fn: async () => {
      const taskState = createPlan("Test replan loop guard");
      taskState.replan_count = 3;
      const res = generateReplan(taskState, { type: ReplanTrigger.OUTPUT_INVALID });
      assert.strictEqual(res.success, false);
      assert.strictEqual(taskState.status, TaskStatus.FAILED);
      assert.ok(res.reason.includes("Maximum replan limit"));
    }
  }
]);
