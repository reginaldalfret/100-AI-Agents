import assert from "node:assert";
import { getModelById, getAllModels, getDomainSpecialistModels, isDomainSpecialistModel } from "../../platform/models/model-registry.js";

console.log("Running: tests/models/medgemma-4b.test.js");

// 1. Model exists in registry
const model = getModelById("medgemma-4b");
assert.ok(model, "medgemma-4b must exist in registry");

// 2. Exact metadata verification
assert.strictEqual(model.model_id, "medgemma-4b");
assert.strictEqual(model.ollama_name, "medgemma:4b-it-q4_K_M");
assert.strictEqual(model.name, "MedGemma 4B");
assert.strictEqual(model.provider, "Google");
assert.strictEqual(model.domain, "HEALTHCARE");
assert.strictEqual(model.type, "DOMAIN_SPECIALIST");
assert.strictEqual(model.category, "DOMAIN_SPECIALIST");
assert.strictEqual(model.parameters, "4.3B");
assert.strictEqual(model.quantization, "Q4_K_M");
assert.strictEqual(model.context_length, 131072);
assert.deepStrictEqual(model.input_modalities, ["text", "image"]);
assert.strictEqual(model.execution_target, "GPU");
assert.strictEqual(model.primaryTag, "HEALTHCARE");
assert.strictEqual(model.secondaryTag, "MEDICAL_AI");

// 3. Domain specialist helpers
assert.strictEqual(isDomainSpecialistModel("medgemma-4b"), true);
assert.strictEqual(isDomainSpecialistModel("medgemma:4b-it-q4_K_M"), true);

console.log("✓ tests/models/medgemma-4b.test.js passed successfully.");
