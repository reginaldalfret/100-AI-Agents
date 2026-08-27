import assert from "node:assert";
import { getModelById } from "../../platform/models/model-registry.js";

console.log("Running: tests/models/medgemma-safety.test.js");

const model = getModelById("medgemma-4b");
assert.ok(model.disclaimer, "MedGemma must provide a clinical safety disclaimer");
assert.ok(model.disclaimer.includes("Not a substitute for a qualified healthcare professional"), "Disclaimer must contain required safety statement");
assert.strictEqual(model.endpoint, "http://127.0.0.1:11434");

console.log("✓ tests/models/medgemma-safety.test.js passed successfully.");
