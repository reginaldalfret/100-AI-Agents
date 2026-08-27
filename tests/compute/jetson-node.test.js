import test from "node:test";
import assert from "node:assert/strict";

import { nodeManager, NodeType, NodeStatus } from "../../platform/compute/node-manager.js";
import { jetsonProvider } from "../../platform/models/providers/jetson-provider.js";
import { laptopProvider } from "../../platform/models/providers/laptop-provider.js";
import { getModelById, isJetsonModel } from "../../platform/models/model-registry.js";
import { routeTaskToLocalModel } from "../../platform/models/model-router.js";
import { getHardwareInfo } from "../../platform/system/hardware-info.js";
import { buildExecutionTrace } from "../../platform/system/execution-trace.js";
import { evaluateSovereignEgress } from "../../platform/security/sovereign-policy.js";

test("NVIDIA Jetson LAN Compute Node Integration Test Suite", async (t) => {

  await t.test("1. Verify Node Manager registers Laptop and Jetson nodes", () => {
    const nodes = nodeManager.getNodes();
    assert.ok(nodes.length >= 2, "Expected at least 2 registered compute nodes");

    const laptop = nodes.find(n => n.id === "node-laptop-01");
    assert.ok(laptop, "Laptop host node must be registered");
    assert.equal(laptop.type, NodeType.LAPTOP_LOCAL);

    const jetson = nodes.find(n => n.id === "node-jetson-01");
    assert.ok(jetson, "Jetson node must be registered");
    assert.equal(jetson.type, NodeType.JETSON_LAN);
    assert.ok(jetson.host.startsWith("10.") || jetson.host.startsWith("192.168."), "Jetson host must be on a private LAN");
  });

  await t.test("2. Verify Sovereign Egress Policy allows Private LAN Jetson endpoint", () => {
    const jetsonEndpoint = jetsonProvider.endpoint;
    const egress = evaluateSovereignEgress(jetsonEndpoint, "JETSON_TEST");
    assert.equal(egress.allowed, true, "Private LAN Jetson communication must be allowed");
    assert.equal(egress.decision, "ALLOWED");
    assert.notEqual(egress.classification, "PUBLIC_EXTERNAL", "Jetson must not be classified as public internet");
  });

  await t.test("3. Verify Jetson Model Registry identification & routing", () => {
    const model = getModelById("jetson-qwen3.8");
    assert.ok(model, "Jetson Qwen model must be present in registry");
    assert.equal(model.execution_target, "JETSON_GPU");
    assert.equal(isJetsonModel("jetson-qwen3.8"), true);
    assert.equal(isJetsonModel("Qwen3.8_Unsloth:latest"), true);
    assert.equal(isJetsonModel("nemotron-3-nano"), false);
  });

  await t.test("4. Verify Model Router dispatches to Jetson when requested", async () => {
    const routed = await routeTaskToLocalModel({
      task_type: "code-generation",
      content: "Complex reasoning problem",
      model_override: "jetson"
    });
    assert.equal(routed.selected_model, "jetson-qwen3.8");
    assert.equal(routed.external_calls, 0);
    assert.equal(routed.is_air_gapped, true);
  });

  await t.test("5. Check Jetson Node live health & discovery on Private LAN", async () => {
    const health = await nodeManager.checkNodeHealth("node-jetson-01");
    console.log("    [Jetson Node Live Health Result]:", JSON.stringify(health));
    assert.ok(health.nodeId === "node-jetson-01");
    if (health.status === NodeStatus.ONLINE) {
      assert.ok(health.latencyMs >= 0, "Latency must be a non-negative number");
      assert.ok(Array.isArray(health.availableModels) && health.availableModels.length > 0, "Available models should be listed");
      assert.equal(health.is_air_gapped, true);
    }
  });

  await t.test("6. Verify Jetson Provider stream / generation with 0 cloud egress", async () => {
    const health = await jetsonProvider.health();
    if (health.status === "ONLINE") {
      let streamedTokens = "";
      const result = await jetsonProvider.stream({
        model: "Qwen3.8_Unsloth:latest",
        prompt: "Respond with the word: JETSON_TEST_OK",
        options: { num_predict: 20 },
        onToken: (chunk) => {
          streamedTokens += chunk;
        }
      });
      assert.ok(result.fullText.length > 0, "Should receive non-empty text from Jetson");
      assert.equal(result.node, "node-jetson-01");
      assert.equal(result.execution_target, "JETSON_GPU");
      console.log("    [Jetson Stream Output]:", result.fullText.trim());
    } else {
      console.log("    [Jetson Offline Notice]: Skipping live stream call because node is currently offline");
    }
  });

  await t.test("7. Verify Execution Trace builder correctly renders Jetson GPU provenance", () => {
    const trace = buildExecutionTrace({
      agent: { agent_id: "agent-301", name: "Super AI Agent" },
      modelName: "NVIDIA Jetson Qwen 3.8 27B",
      runtimeModel: "Qwen3.8_Unsloth:latest",
      executionType: "jetson_gpu",
      node: "node-jetson-01",
      durationMs: 1250,
      tokensPerSec: 18.5,
      externalCalls: 0
    });

    assert.equal(trace.hardware.name, "NVIDIA Jetson Compute Node");
    assert.equal(trace.hardware.executionType, "jetson_gpu");
    assert.equal(trace.hardware.isGPU, true);
    assert.equal(trace.sovereignty.externalCalls, 0);
    assert.equal(trace.sovereignty.displayText, "0 external network requests");
  });

  await t.test("8. Verify Circuit Breaker and graceful failover behavior", () => {
    assert.equal(typeof jetsonProvider._isCircuitOpen, "function");
    assert.equal(jetsonProvider.circuit.state, "CLOSED");
  });
});
