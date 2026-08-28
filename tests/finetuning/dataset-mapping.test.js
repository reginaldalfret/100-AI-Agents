import assert from "node:assert";
import { splitDataset } from "../../platform/finetuning/dataset-manager.js";

console.log("Running: tests/finetuning/dataset-mapping.test.js");

const sampleData = Array.from({ length: 100 }, (_, i) => ({
  instruction: `Task ${i}`,
  input: `Context ${i}`,
  output: `Result ${i}`
}));

const splitResult = splitDataset(sampleData, 0.8, 0.1, 0.1);
assert.strictEqual(splitResult.totalCount, 100);
assert.strictEqual(splitResult.trainCount, 80);
assert.strictEqual(splitResult.valCount, 10);
assert.strictEqual(splitResult.testCount, 10);

// Test reproducibility & dataset hash
assert.ok(splitResult.datasetHash, "Must compute dataset SHA-256 hash");
assert.strictEqual(splitResult.datasetHash.length, 64);

const splitAgain = splitDataset(sampleData, 0.8, 0.1, 0.1);
assert.strictEqual(splitAgain.datasetHash, splitResult.datasetHash);

console.log("✓ tests/finetuning/dataset-mapping.test.js passed successfully.");
