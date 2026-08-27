import assert from "node:assert";
import { classifyTask, TaskType } from "../../platform/models/task-classifier.js";
import { routeTaskToLocalModel } from "../../platform/models/model-router.js";

console.log("Running: tests/models/medgemma-healthcare-routing.test.js");

// 1. Task Classification for Healthcare
const t1 = classifyTask({ prompt: "Explain the symptoms of hypertension." });
assert.strictEqual(t1.task_type, TaskType.HEALTHCARE);
assert.strictEqual(t1.preferred_model_id, "medgemma-4b");

const t2 = classifyTask({ prompt: "Explain the difference between Type 1 and Type 2 diabetes." });
assert.strictEqual(t2.task_type, TaskType.HEALTHCARE);
assert.strictEqual(t2.preferred_model_id, "medgemma-4b");

const t3 = classifyTask({ prompt: "What are common risk factors for cardiovascular disease?" });
assert.strictEqual(t3.task_type, TaskType.HEALTHCARE);
assert.strictEqual(t3.preferred_model_id, "medgemma-4b");

const t4 = classifyTask({ prompt: "Explain what an ECG measures." });
assert.strictEqual(t4.task_type, TaskType.HEALTHCARE);
assert.strictEqual(t4.preferred_model_id, "medgemma-4b");

// 2. Non-healthcare queries should not route to MedGemma
const tCode = classifyTask({ prompt: "Write a python script to parse CSV files." });
assert.notStrictEqual(tCode.preferred_model_id, "medgemma-4b");

const tCyber = classifyTask({ prompt: "How do I prevent SQL injection attacks?" });
assert.strictEqual(tCyber.preferred_model_id, "qwen3-1.7b-cyber");

console.log("✓ tests/models/medgemma-healthcare-routing.test.js passed successfully.");
