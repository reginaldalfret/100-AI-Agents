import { listAvailableModels, getModelById } from "../../../platform/models/model-registry.js";
import { classifyTask, TaskType } from "../../../platform/models/task-classifier.js";
import { routeTaskToLocalModel } from "../../../platform/models/model-router.js";
import { modelLifecycle } from "../../../platform/models/model-lifecycle.js";
import { egressMonitor } from "../../../platform/security/egress-monitor.js";
import { runTestSuite } from "../harness.js";
import assert from "node:assert";

await runTestSuite("Sovereign Multi-Model Platform Tests (Nemotron, Vision, Code)", [
  {
    name: "Model Registry Contains 3 Specialized Open-Weight Models",
    fn: async () => {
      const models = listAvailableModels();
      assert.ok(models.length >= 3);
      assert.ok(getModelById("nemotron-3-nano"));
      assert.ok(getModelById("local-vision-ocr"));
      assert.ok(getModelById("local-code-specialist"));
    }
  },
  {
    name: "Task Classifier Routes Visual Tasks to Vision Model",
    fn: async () => {
      const visualTasks = [
        { prompt: "Analyze this equipment photo for corrosion defects", attachments: [{ name: "pipe_cui.jpg" }] },
        { prompt: "Read this scanned P&ID drawing and extract relief valve tags", attachments: [{ name: "dwg_001.png" }] }
      ];

      for (const t of visualTasks) {
        const c = classifyTask(t);
        assert.strictEqual(c.task_type, TaskType.VISION_MULTIMODAL);
        assert.strictEqual(c.preferred_model_id, "local-vision-ocr");
      }
    }
  },
  {
    name: "Task Classifier Routes Code Tasks to Qwen Coder",
    fn: async () => {
      const codeTasks = [
        { prompt: "Write a python script to calculate remaining life from thickness CSV" },
        { prompt: "Debug this automation script in the sandbox" }
      ];

      for (const t of codeTasks) {
        const c = classifyTask(t);
        assert.strictEqual(c.task_type, TaskType.CODING_SANDBOX);
        assert.strictEqual(c.preferred_model_id, "local-code-specialist");
      }
    }
  },
  {
    name: "Task Classifier Routes Epistemic Reasoning Tasks to Nemotron 3 Nano",
    fn: async () => {
      const reasoningTask = { prompt: "Plan multi-agent inspection workflow and summarize findings for GM approval" };
      const c = classifyTask(reasoningTask);
      assert.strictEqual(c.task_type, TaskType.REASONING);
      assert.strictEqual(c.preferred_model_id, "nemotron-3-nano");
    }
  },
  {
    name: "Model Lifecycle Manages Memory and Enforces 0 External Calls",
    fn: async () => {
      egressMonitor.reset();
      const slot = await modelLifecycle.acquireModelSlot("nemotron-3-nano");
      assert.strictEqual(slot.acquired, true);

      const release = modelLifecycle.releaseModelSlot("nemotron-3-nano", { duration_ms: 25 });
      assert.ok(release.trace_id);
      assert.strictEqual(release.external_calls, 0);
      assert.strictEqual(release.is_air_gapped, true);
    }
  }
]);
