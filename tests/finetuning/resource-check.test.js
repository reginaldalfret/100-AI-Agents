import assert from "node:assert";
import {
  evaluateTrainingFeasibility,
  FeasibilityStatus
} from "../../platform/finetuning/resource-checker.js";

console.log("Running: tests/finetuning/resource-check.test.js");

// 1. Safe QLoRA on RTX 2050
const safeFeasibility = evaluateTrainingFeasibility({
  modelId: "falcon3-1b-instruct",
  method: "QLoRA",
  loraRank: 16,
  batchSize: 1,
  sequenceLength: 1024
});

assert.strictEqual(safeFeasibility.canStart, true);
assert.strictEqual(safeFeasibility.status, FeasibilityStatus.SAFE);
assert.ok(safeFeasibility.vramEstimateMb <= 3500);

// 2. Reject Full Fine-Tuning on 4GB VRAM
const fullFeasibility = evaluateTrainingFeasibility({
  modelId: "falcon3-1b-instruct",
  method: "Full"
});

assert.strictEqual(fullFeasibility.canStart, false);
assert.strictEqual(fullFeasibility.status, FeasibilityStatus.UNSUPPORTED);
assert.ok(fullFeasibility.reason.includes("disabled on 4GB VRAM"));

console.log("✓ tests/finetuning/resource-check.test.js passed successfully.");
