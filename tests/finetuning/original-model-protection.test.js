import assert from "node:assert";
import { getTrainableModelById } from "../../platform/finetuning/trainable-model-registry.js";
import { getModelById } from "../../platform/models/model-registry.js";

console.log("Running: tests/finetuning/original-model-protection.test.js");

const baseModel = getTrainableModelById("falcon3-1b-instruct");
assert.ok(baseModel, "Trainable base model must exist");
assert.strictEqual(baseModel.trainable, true);

const servingBaseModel = getModelById("falcon3-1b-instruct") || getModelById("nemotron-3-nano");
assert.ok(servingBaseModel, "Serving base model must exist in registry");
assert.strictEqual(servingBaseModel.status, "ready");
assert.ok(servingBaseModel.role.length > 0);

console.log("✓ tests/finetuning/original-model-protection.test.js passed successfully.");
