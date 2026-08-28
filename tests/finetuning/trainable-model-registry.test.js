import assert from "node:assert";
import {
  listTrainableModels,
  getTrainableModelById,
  isTrainable,
  getAllTrainableModels
} from "../../platform/finetuning/trainable-model-registry.js";

console.log("Running: tests/finetuning/trainable-model-registry.test.js");

// 1. Trainable Models Check
const trainable = listTrainableModels();
assert.ok(trainable.length >= 5, "Must contain verified trainable base models");

const falcon = getTrainableModelById("falcon3-1b-instruct");
assert.ok(falcon, "Falcon3 1B must exist");
assert.strictEqual(falcon.trainable, true);
assert.strictEqual(falcon.recommended_method, "QLoRA");
assert.strictEqual(isTrainable("falcon3-1b-instruct"), true);

const qwen = getTrainableModelById("qwen2.5-coder-1.5b");
assert.ok(qwen, "Qwen 2.5 Coder 1.5B must exist");
assert.strictEqual(qwen.trainable, true);

const llama = getTrainableModelById("llama3.2-1b");
assert.ok(llama, "Llama 3.2 1B must exist");
assert.strictEqual(llama.trainable, true);

// 2. Untrainable / Missing Checkpoint Model
const medgemma27b = getTrainableModelById("medgemma-27b");
assert.ok(medgemma27b, "MedGemma 27B record must exist");
assert.strictEqual(medgemma27b.trainable, false);
assert.strictEqual(medgemma27b.checkpoint_available, false);
assert.strictEqual(medgemma27b.status, "Training checkpoint unavailable.");
assert.strictEqual(isTrainable("medgemma-27b"), false);

console.log("✓ tests/finetuning/trainable-model-registry.test.js passed successfully.");
