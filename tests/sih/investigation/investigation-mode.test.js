import { investigationEngine, InvestigationStatus } from "../../../platform/investigation/index.js";
import { runTestSuite } from "../harness.js";
import assert from "node:assert";

await runTestSuite("Industrial Investigation Mode & Provenance Tests", [
  {
    name: "Executes End-to-End Industrial Investigation on HX-204 with Trend & Confidence",
    fn: async () => {
      const inv = await investigationEngine.startInvestigation(
        "Investigate the declining wall thickness of HX-204 over the last three inspections and prepare a management decision package.",
        { auto_approve: false }
      );

      assert.strictEqual(inv.equipment_id, "HX-204");
      assert.strictEqual(inv.status, InvestigationStatus.WAITING_FOR_APPROVAL);
      assert.ok(inv.historical_trend);
      assert.strictEqual(inv.historical_trend.current_thickness_mm, 5.90);
      assert.ok(inv.confidence_assessment);
      assert.ok(inv.timeline.length >= 3);
      assert.strictEqual(inv.task_result.sovereignty_proof.total_external_calls, 0);
    }
  },
  {
    name: "Submits Human-In-The-Loop Approval and records full decision provenance",
    fn: async () => {
      const inv = await investigationEngine.startInvestigation("Investigate HX-204 nozzle", { auto_approve: false });
      const approvedInv = investigationEngine.submitApproval(inv.investigation_id, {
        decision: "APPROVED",
        inspector_id: "INSP-MRPL-902",
        role: "Chief Safety Officer",
        comments: "Approved Form-B weld-overlay sleeve repair plan."
      });

      assert.strictEqual(approvedInv.status, InvestigationStatus.COMPLETED);
      assert.strictEqual(approvedInv.approval_record.decision, "APPROVED");

      const prov = investigationEngine.getProvenance(inv.investigation_id);
      assert.strictEqual(prov.sovereignty_guarantee.total_external_calls, 0);
      assert.strictEqual(prov.sovereignty_guarantee.is_air_gapped, true);
    }
  },
  {
    name: "Supports 'Request More Evidence' feedback loop transitioning state to WAITING_FOR_EVIDENCE",
    fn: async () => {
      const inv = await investigationEngine.startInvestigation("Investigate HX-204 nozzle", { auto_approve: false });
      const updatedInv = investigationEngine.submitApproval(inv.investigation_id, {
        decision: "REQUEST_MORE_EVIDENCE",
        inspector_id: "INSP-MRPL-902",
        comments: "Provide operating fluid temperature from SCADA historian."
      });

      assert.strictEqual(updatedInv.status, InvestigationStatus.WAITING_FOR_EVIDENCE);
    }
  }
]);
