import assert from "node:assert";

console.log("Running: tests/finetuning/model-promotion.test.js");

function evaluatePromotionStatus(score) {
  return score >= 0.75 ? "VALIDATED" : "EXPERIMENTAL";
}

assert.strictEqual(evaluatePromotionStatus(0.68), "EXPERIMENTAL");
assert.strictEqual(evaluatePromotionStatus(0.75), "VALIDATED");
assert.strictEqual(evaluatePromotionStatus(0.92), "VALIDATED");

console.log("✓ tests/finetuning/model-promotion.test.js passed successfully.");
