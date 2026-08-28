import assert from "node:assert";
import { ingestTrainingDataset, DatasetType } from "../../platform/finetuning/dataset-manager.js";

console.log("Running: tests/finetuning/dataset-ingestion.test.js");

const csvContent = `instruction,input,output
"What are the inspection intervals for heat exchangers?","","Per API-653 standards, ultrasonic testing is conducted every 5 years."
"Explain emergency shutdown procedures for distillation column.","","Isolate feed valves, initiate nitrogen purge, and monitor overhead pressure."
"What is pump cavitation?","","Formation and rapid collapse of vapor bubbles causing impeller erosion."`;

const dataset = ingestTrainingDataset({
  filename: "synthetic_industrial_faq.csv",
  content: csvContent
});

assert.ok(dataset, "Dataset must be ingested successfully");
assert.ok(dataset.dataset_id.startsWith("ft_ds_"), "Must generate unique ft_ds_ ID");
assert.strictEqual(dataset.rows, 3);
assert.strictEqual(dataset.columns, 3);
assert.strictEqual(dataset.detectedType, DatasetType.INSTRUCTION);
assert.strictEqual(dataset.isCompatible, true);
assert.ok(dataset.path.includes("fine-tuning\\datasets") || dataset.path.includes("fine-tuning/datasets"), "Must persist on E: drive fine-tuning folder");

console.log("✓ tests/finetuning/dataset-ingestion.test.js passed successfully.");
