import { WorkflowEngine } from "../../platform/workflow-engine/engine.js";
import { runTestSuite } from "./harness.js";
import assert from "node:assert";

await runTestSuite("Industrial Workflows & Human-in-the-Loop Tests", [
  {
    name: "Lists registered industrial workflows",
    fn: async () => {
      const wfs = WorkflowEngine.getAvailableWorkflows();
      assert.ok(wfs.length >= 4);
      assert.ok(wfs.some(w => w.id === "inspection-report-analysis"));
    }
  },
  {
    name: "Executes Inspection Workflow until Human Approval step",
    fn: async () => {
      const inst = await WorkflowEngine.startWorkflow("inspection-report-analysis", { equipment_id: "TK-101" });
      assert.strictEqual(inst.status, "pending_approval");
      assert.ok(inst.evidenceLedger.length >= 3);
      assert.strictEqual(inst.pendingDecision.role, "Chief Inspection Engineer / General Manager");
    }
  },
  {
    name: "Completes Workflow upon Human Approval sign-off",
    fn: async () => {
      const inst = await WorkflowEngine.startWorkflow("inspection-report-analysis", { equipment_id: "TK-101" });
      const approved = await WorkflowEngine.submitHumanDecision(inst.id, { decision: "approved", notes: "Authorized by Chief Engineer" });
      assert.strictEqual(approved.status, "completed");
    }
  }
]);
