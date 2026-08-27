import assert from "node:assert";
import { ingestDatasetFile, deleteDataset } from "../../platform/datasets/dataset-registry.js";
import { executeDatasetSQL } from "../../platform/datasets/sql-engine.js";

console.log("Running: tests/datasets/result-validation.test.js");

const sampleCsv = `id,name,value\n1,Alpha,100\n2,Beta,200`;

(async () => {
  const dataset = await ingestDatasetFile({
    filename: "res_val.csv",
    buffer: Buffer.from(sampleCsv, "utf8")
  });

  const res = executeDatasetSQL(dataset.dataset_id, "SELECT * FROM \"dataset\"");

  assert.strictEqual(res.status, "success");
  assert.strictEqual(res.dataset_id, dataset.dataset_id);
  assert.ok(typeof res.execution_time_ms === "number", "execution_time_ms must be a number");
  assert.strictEqual(res.row_count, 2);
  assert.strictEqual(res.rows_scanned, 2);
  assert.deepStrictEqual(res.columns, ["id", "name", "value"]);
  assert.strictEqual(Array.isArray(res.result), true);

  deleteDataset(dataset.dataset_id);
  console.log("✓ tests/datasets/result-validation.test.js passed successfully.");
})().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
