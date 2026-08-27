import assert from "node:assert";
import { classifyTask, TaskType } from "../../platform/models/task-classifier.js";
import { getModelById } from "../../platform/models/model-registry.js";

console.log("Running: tests/orchestration/healthcare-routing.test.js");

const scenarios = [
  { prompt: "Summarize this medical text about asthma.", expectedModel: "medgemma-4b", expectedType: TaskType.HEALTHCARE },
  { prompt: "Explain how diabetes affects insulin production.", expectedModel: "medgemma-4b", expectedType: TaskType.HEALTHCARE },
  { prompt: "What are the common symptoms of cardiovascular disease?", expectedModel: "medgemma-4b", expectedType: TaskType.HEALTHCARE },
  { prompt: "Explain what an ECG measures.", expectedModel: "medgemma-4b", expectedType: TaskType.HEALTHCARE },
  { prompt: "Write Python code to analyze sales.", expectedModel: "local-code-specialist", expectedType: TaskType.CODING_SANDBOX },
  { prompt: "Detect OWASP Top 10 vulnerabilities in this code.", expectedModel: "qwen3-1.7b-cyber", expectedType: TaskType.CYBERSECURITY }
];

for (const sc of scenarios) {
  const res = classifyTask({ prompt: sc.prompt });
  assert.strictEqual(res.task_type, sc.expectedType, `Task type mismatch for: ${sc.prompt}`);
  assert.strictEqual(res.preferred_model_id, sc.expectedModel, `Model mismatch for: ${sc.prompt}`);
  const modelSpec = getModelById(res.preferred_model_id);
  assert.ok(modelSpec, `Model spec must exist for: ${res.preferred_model_id}`);
}

console.log("✓ tests/orchestration/healthcare-routing.test.js passed successfully.");
