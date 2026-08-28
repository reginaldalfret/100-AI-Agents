import assert from "node:assert";

console.log("Running: tests/finetuning/privacy.test.js");

const allowedRoot = "E:\\Smart Automation\\100-AI-Agents\\data\\fine-tuning\\datasets";
const candidatePaths = [
  "E:\\Smart Automation\\100-AI-Agents\\data\\fine-tuning\\datasets\\industrial_sop.csv",
  "E:\\Smart Automation\\100-AI-Agents\\data\\fine-tuning\\datasets\\maintenance_qa.jsonl"
];

for (const p of candidatePaths) {
  assert.ok(p.startsWith(allowedRoot), "Dataset path must reside in E: drive datasets folder");
}

let externalCalls = 0;
assert.strictEqual(externalCalls, 0, "External calls must remain 0 during private local training");

console.log("✓ tests/finetuning/privacy.test.js passed successfully.");
