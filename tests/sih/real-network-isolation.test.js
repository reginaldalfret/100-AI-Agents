import { evaluateSovereignEgress, NetworkClassification } from "../../platform/security/sovereign-policy.js";
import { egressMonitor } from "../../platform/security/egress-monitor.js";
import { WorkflowEngine } from "../../platform/workflow-engine/engine.js";
import { runTestSuite } from "./harness.js";
import assert from "node:assert";

await runTestSuite("Adversarial Real-Network Isolation & Hard Egress Proof", [
  {
    name: "Intercepts and Blocks Malicious External Data Exfiltration Attempt",
    fn: async () => {
      const hostileDestinations = [
        "api.openai.com:443",
        "api.anthropic.com:443",
        "generativelanguage.googleapis.com:443",
        "8.8.8.8:53",
        "142.250.190.46:80"
      ];

      for (const dest of hostileDestinations) {
        const check = evaluateSovereignEgress(dest, "HTTP_OUTBOUND");
        assert.strictEqual(check.allowed, false, `Destination ${dest} should be blocked`);
        assert.strictEqual(check.decision, "BLOCKED");
        assert.strictEqual(check.classification, NetworkClassification.PUBLIC_EXTERNAL);
      }
    }
  },
  {
    name: "Independent Egress Sniffer Proves Zero External Calls During Full Industrial Workflow",
    fn: async () => {
      egressMonitor.reset();

      // Start independent sniffer snapshot
      const preMetrics = egressMonitor.getMetrics();
      assert.strictEqual(preMetrics.external_ai_calls, 0);

      // Run Full Multi-Step Industrial Workflow
      const instance = await WorkflowEngine.startWorkflow("inspection-report-analysis", {
        equipment_id: "TK-101",
        filePath: "adversarial_test_scan.pdf"
      });

      // Complete Human Authorization
      const finalized = await WorkflowEngine.submitHumanDecision(instance.id, {
        decision: "approved",
        notes: "Authorized by Chief Engineer"
      });

      assert.strictEqual(finalized.status, "completed");

      // Verify Sniffer Post-Execution State
      const postMetrics = egressMonitor.getMetrics();
      assert.strictEqual(postMetrics.external_ai_calls, 0, "Must be zero external AI calls");
      assert.strictEqual(postMetrics.cloud_api_calls, 0, "Must be zero cloud API calls");
      assert.strictEqual(postMetrics.external_data_transfers_bytes, 0, "Must be zero bytes transferred externally");
      assert.strictEqual(postMetrics.zero_data_exfiltration_verified, true, "Zero data exfiltration must be verified");
      assert.ok(postMetrics.local_model_inferences >= 2, "Must execute local model inferences");
    }
  }
]);
