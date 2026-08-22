import { evaluateSovereignEgress, classifyNetworkDestination, NetworkClassification } from "../../platform/security/sovereign-policy.js";
import { egressMonitor } from "../../platform/security/egress-monitor.js";
import { runTestSuite } from "./harness.js";
import assert from "node:assert";

await runTestSuite("Sovereign Policy & Air-Gap Egress Tests", [
  {
    name: "Permits Local Loopback Connections (127.0.0.1)",
    fn: async () => {
      const res = evaluateSovereignEgress("127.0.0.1:11434");
      assert.strictEqual(res.allowed, true);
      assert.strictEqual(res.decision, "ALLOWED");
      assert.strictEqual(res.classification, NetworkClassification.LOCAL_LOOPBACK);
    }
  },
  {
    name: "Blocks Public External IP (8.8.8.8)",
    fn: async () => {
      const res = evaluateSovereignEgress("8.8.8.8:443");
      assert.strictEqual(res.allowed, false);
      assert.strictEqual(res.decision, "BLOCKED");
      assert.strictEqual(res.classification, NetworkClassification.PUBLIC_EXTERNAL);
    }
  },
  {
    name: "Blocks External Cloud AI API (api.openai.com)",
    fn: async () => {
      const res = evaluateSovereignEgress("api.openai.com:443");
      assert.strictEqual(res.allowed, false);
      assert.strictEqual(res.decision, "BLOCKED");
    }
  },
  {
    name: "Egress Monitor Records and Counts Local Inferences",
    fn: async () => {
      egressMonitor.recordConnection({ process: "agent-001", destination: "127.0.0.1:11434" });
      const metrics = egressMonitor.getMetrics();
      assert.strictEqual(metrics.external_ai_calls, 0);
      assert.strictEqual(metrics.zero_data_exfiltration_verified, true);
    }
  }
]);
