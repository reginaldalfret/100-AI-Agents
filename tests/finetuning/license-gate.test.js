import assert from "node:assert";
import { getTrainableModelById } from "../../platform/finetuning/trainable-model-registry.js";

console.log("Running: tests/finetuning/license-gate.test.js");

const falcon = getTrainableModelById("falcon3-1b-instruct");
assert.ok(falcon.license_permissions.commercial_use, "Apache 2.0 allows commercial use");
assert.ok(falcon.license_permissions.adapter_export, "Allows adapter export");

const gemma = getTrainableModelById("gemma3-1b");
assert.ok(gemma.license.includes("Gemma Terms"));

console.log("✓ tests/finetuning/license-gate.test.js passed successfully.");
