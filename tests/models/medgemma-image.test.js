import assert from "node:assert";
import { getModelById, ModelModality } from "../../platform/models/model-registry.js";
import { classifyTask } from "../../platform/models/task-classifier.js";

console.log("Running: tests/models/medgemma-image.test.js");

const model = getModelById("medgemma-4b");
assert.ok(model.input_modalities.includes("image"), "MedGemma must support image input");
assert.ok(model.supported_modalities.includes(ModelModality.VISION), "MedGemma must declare VISION modality");

// Multimodal classification with image attachment
const taskWithImage = classifyTask({
  prompt: "Analyze this chest x-ray scan.",
  attachments: [{ name: "sample_scan.png", type: "image/png" }]
});
assert.strictEqual(taskWithImage.preferred_model_id, "medgemma-4b");
assert.strictEqual(taskWithImage.primary_modality, "vision");

console.log("✓ tests/models/medgemma-image.test.js passed successfully.");
