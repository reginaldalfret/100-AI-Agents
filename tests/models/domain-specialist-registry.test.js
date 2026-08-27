import assert from "node:assert";
import { getDomainSpecialistModels, isDomainSpecialistModel, getModelById } from "../../platform/models/model-registry.js";

console.log("Running: tests/models/domain-specialist-registry.test.js");

const specialists = getDomainSpecialistModels();
assert.ok(specialists.length >= 2, "Must contain at least MedGemma 4B and Qwen3 1.7B Cyber");

const hasMedGemma = specialists.some(m => m.model_id === "medgemma-4b");
const hasCyber = specialists.some(m => m.model_id === "qwen3-1.7b-cyber");

assert.ok(hasMedGemma, "MedGemma 4B must be in domain specialists");
assert.ok(hasCyber, "Qwen3 1.7B Cyber must be in domain specialists");

assert.strictEqual(isDomainSpecialistModel("medgemma-4b"), true);
assert.strictEqual(isDomainSpecialistModel("qwen3-1.7b-cyber"), true);
assert.strictEqual(isDomainSpecialistModel("gemma3-1b"), false);

console.log("✓ tests/models/domain-specialist-registry.test.js passed successfully.");
