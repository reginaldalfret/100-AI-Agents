import assert from "node:assert";
import { validateDatasetQuality } from "../../platform/finetuning/dataset-manager.js";

console.log("Running: tests/finetuning/dataset-validation.test.js");

// 1. Valid data
const validData = [
  { instruction: "Summarize the text.", input: "Some text...", output: "A summary." },
  { instruction: "Translate to Spanish.", input: "Hello", output: "Hola" },
  { instruction: "Calculate pressure drop.", input: "Flow rate: 100", output: "Delta P = 2.4 bar" }
];
const resultValid = validateDatasetQuality(validData);
assert.strictEqual(resultValid.passed, true);
assert.strictEqual(resultValid.validExamples, 3);
assert.strictEqual(resultValid.invalidExamples, 0);

// 2. Reject missing output
const missingOutputData = [
  { instruction: "Explain quantum computing.", output: "" },
  { instruction: "What is 2+2?" }
];
const resultMissing = validateDatasetQuality(missingOutputData);
assert.strictEqual(resultMissing.passed, false);
assert.strictEqual(resultMissing.missingOutputs, 2);

// 3. Reject duplicate rows
const duplicateData = [
  { instruction: "Hello", output: "World" },
  { instruction: "Hello", output: "World" },
  { instruction: "Unique task", output: "Unique answer" }
];
const resultDuplicate = validateDatasetQuality(duplicateData);
assert.strictEqual(resultDuplicate.duplicateExamples, 1);

// 4. Reject empty rows
const emptyRowsData = [
  {},
  { instruction: "", output: "" },
  { instruction: "Valid task", output: "Valid output" }
];
const resultEmpty = validateDatasetQuality(emptyRowsData);
assert.strictEqual(resultEmpty.emptyRows, 1);

// 5. Reject >4096 token rows
const hugeText = "token ".repeat(4200);
const oversizedData = [
  { instruction: "Process huge text", output: hugeText }
];
const resultOversized = validateDatasetQuality(oversizedData);
assert.strictEqual(resultOversized.passed, false);
assert.ok(resultOversized.errors.some(e => e.includes("4096")));

console.log("✓ tests/finetuning/dataset-validation.test.js passed successfully.");
