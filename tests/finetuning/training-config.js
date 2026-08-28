import assert from "node:assert";
import { validateAndNormalizeConfig, DEFAULT_TRAINING_CONFIG } from "../../platform/finetuning/training-config.js";

console.log("Running: tests/finetuning/training-config.test.js");

// 1. Default config
const defaultConfig = validateAndNormalizeConfig({});
assert.strictEqual(defaultConfig.method, "QLoRA");
assert.strictEqual(defaultConfig.epochs, 3);
assert.strictEqual(defaultConfig.lora_rank, 16);
assert.strictEqual(defaultConfig.lora_alpha, 32);

// 2. Custom bounded config
const customConfig = validateAndNormalizeConfig({
  epochs: 50, // exceeds max bound 10
  lora_rank: 32,
  learning_rate: 0.0001
});

assert.strictEqual(customConfig.epochs, 10, "Epochs must be clamped to max 10");
assert.strictEqual(customConfig.lora_rank, 32);
assert.strictEqual(customConfig.learning_rate, 0.0001);

console.log("✓ tests/finetuning/training-config.test.js passed successfully.");
