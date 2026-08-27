import assert from "node:assert";
import { getModelById } from "../../platform/models/model-registry.js";

console.log("Running: tests/models/medgemma-gpu.test.js");

const model = getModelById("medgemma-4b");
assert.ok(model, "medgemma-4b model spec required");

// Hardware validation
assert.strictEqual(model.execution_target, "GPU");
assert.strictEqual(model.parameters, "4.3B");
assert.strictEqual(model.quantization, "Q4_K_M");
assert.ok(model.vram_mb <= 4096, "VRAM requirement must fit within RTX 2050 4GB ceiling");

console.log("✓ tests/models/medgemma-gpu.test.js passed successfully.");
