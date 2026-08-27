import assert from "node:assert";
import { ingestDatasetFile, deleteDataset } from "../../platform/datasets/dataset-registry.js";
import { analyzeDatasetQuestion } from "../../platform/datasets/dataset-analyst-agent.js";

console.log("Running: tests/orchestration/dataset-routing.test.js");

const sampleCsv = `plant,product,production_tons\nPlant A,Diesel,1200\nPlant B,Diesel,1800\nPlant A,Petrol,600`;

(async () => {
  const dataset = await ingestDatasetFile({
    filename: "MRPL_Production_2026.csv",
    buffer: Buffer.from(sampleCsv, "utf8")
  });

  const response = await analyzeDatasetQuestion({
    datasetId: dataset.dataset_id,
    question: "Which plant had the highest production?"
  });

  // Verify answer contract fields
  assert.strictEqual(response.status, "success");
  assert.strictEqual(response.dataset_id, dataset.dataset_id);
  assert.strictEqual(response.filename, "MRPL_Production_2026.csv");
  assert.strictEqual(response.confidence, "QUERY-BACKED");
  assert.strictEqual(response.external_calls, 0);
  assert.strictEqual(response.network, "LOCAL ONLY");
  assert.ok(typeof response.execution_time_ms === "number");
  assert.ok(typeof response.answer === "string");
  assert.ok(Array.isArray(response.result));

  deleteDataset(dataset.dataset_id);
  console.log("✓ tests/orchestration/dataset-routing.test.js passed successfully.");
})().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
