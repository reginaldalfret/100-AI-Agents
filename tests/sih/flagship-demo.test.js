import { WorkflowEngine } from "../../platform/workflow-engine/engine.js";
import { egressMonitor } from "../../platform/security/egress-monitor.js";
import { runTestSuite } from "./harness.js";
import assert from "node:assert";

await runTestSuite("SIH Flagship End-to-End Industrial Demo Verification", [
  {
    name: "Executes End-to-End Scanned Tank Inspection with 0 External Calls",
    fn: async () => {
      // 1. Reset egress counters
      egressMonitor.reset();

      // 2. Launch Flagship Workflow
      const instance = await WorkflowEngine.startWorkflow("inspection-report-analysis", {
        equipment_id: "TK-101",
        filePath: "scanned_tk101_report.pdf"
      });

      // 3. Verify step outputs
      assert.strictEqual(instance.status, "pending_approval");
      assert.ok(instance.context.stepOutputs["document-ocr-and-extraction"]);
      assert.ok(instance.context.stepOutputs["engineering-and-cui-analysis"]);
      assert.ok(instance.context.stepOutputs["sop-and-statutory-grounding"]);
      assert.ok(instance.context.stepOutputs["deliverable-synthesis"]);

      // 4. Verify deliverables
      const deliverablesPkg = instance.context.stepOutputs["deliverable-synthesis"];
      assert.strictEqual(deliverablesPkg.total_files, 3);

      // 5. Submit Human Approval Sign-off
      const finalized = await WorkflowEngine.submitHumanDecision(instance.id, {
        decision: "approved",
        notes: "Approved emergency de-inventory and shell insert patch replacement."
      });

      assert.strictEqual(finalized.status, "completed");

      // 6. Verify Zero Data Exfiltration Guarantee
      const metrics = egressMonitor.getMetrics();
      assert.strictEqual(metrics.external_ai_calls, 0);
      assert.strictEqual(metrics.cloud_api_calls, 0);
      assert.strictEqual(metrics.external_data_transfers_bytes, 0);
      assert.strictEqual(metrics.zero_data_exfiltration_verified, true);
    }
  }
]);
