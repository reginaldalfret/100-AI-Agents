import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { ingestDatasetFile, getDatasetById, listAllDatasets, deleteDataset } from "../../platform/datasets/dataset-registry.js";

console.log("Running: tests/datasets/dataset-ingestion.test.js");

// Create synthetic test CSV dataset
const sampleCsv = `plant,product,production_tons,date,status
Plant A,Diesel,1250.5,2026-07-01,Active
Plant B,Petrol,980.2,2026-07-02,Active
Plant A,Diesel,1420.8,2026-07-03,Active
Plant C,Kerosene,450.0,2026-07-04,Maintenance
Plant B,Diesel,1100.0,2026-07-05,Active`;

(async () => {
  // 1. Ingest Dataset
  const record = await ingestDatasetFile({
    filename: "test_production.csv",
    buffer: Buffer.from(sampleCsv, "utf8")
  });

  assert.ok(record, "Ingested dataset record must exist");
  assert.ok(record.dataset_id.startsWith("ds_"), "dataset_id must have ds_ prefix");
  assert.strictEqual(record.rows, 5, "Must parse 5 rows");
  assert.strictEqual(record.columns, 5, "Must parse 5 columns");
  assert.strictEqual(record.status, "READY");
  assert.strictEqual(record.format, "CSV");

  // Verify storage on E: drive path
  assert.ok(record.path.includes("data\\datasets") || record.path.includes("data/datasets"), "Must store under data/datasets");

  // 2. Query registry
  const retrieved = getDatasetById(record.dataset_id);
  assert.ok(retrieved, "Must retrieve dataset by ID");
  assert.strictEqual(retrieved.dataset_id, record.dataset_id);

  // 3. List datasets
  const all = listAllDatasets();
  assert.ok(all.some(d => d.dataset_id === record.dataset_id), "Dataset must appear in dataset list");

  // 4. Cleanup test dataset
  deleteDataset(record.dataset_id);

  console.log("✓ tests/datasets/dataset-ingestion.test.js passed successfully.");
})().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
