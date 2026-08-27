import assert from "node:assert";
import { ingestDatasetFile, deleteDataset } from "../../platform/datasets/dataset-registry.js";
import { executeDatasetSQL } from "../../platform/datasets/sql-engine.js";

console.log("Running: tests/datasets/query-execution.test.js");

const sampleCsv = `plant,product,production_tons
Plant A,Diesel,1000
Plant A,Petrol,500
Plant B,Diesel,1500
Plant B,Petrol,750
Plant C,Diesel,2000`;

(async () => {
  const dataset = await ingestDatasetFile({
    filename: "sample_exec_test.csv",
    buffer: Buffer.from(sampleCsv, "utf8")
  });

  // 1. SUM Aggregate Query
  const sumRes = executeDatasetSQL(dataset.dataset_id, "SELECT SUM(\"production_tons\") as total FROM \"dataset\"");
  assert.strictEqual(sumRes.status, "success");
  assert.strictEqual(sumRes.result[0].total, 5750, "Total production must equal 5750");

  // 2. GROUP BY Query
  const groupRes = executeDatasetSQL(dataset.dataset_id, "SELECT \"plant\", SUM(\"production_tons\") as plant_total FROM \"dataset\" GROUP BY \"plant\" ORDER BY plant_total DESC");
  assert.strictEqual(groupRes.row_count, 3);
  assert.strictEqual(groupRes.result[0].plant, "Plant B");
  assert.strictEqual(groupRes.result[0].plant_total, 2250);

  // 3. WHERE Filter Query
  const filterRes = executeDatasetSQL(dataset.dataset_id, "SELECT COUNT(*) as diesel_count FROM \"dataset\" WHERE \"product\" = 'Diesel'");
  assert.strictEqual(filterRes.result[0].diesel_count, 3);

  deleteDataset(dataset.dataset_id);
  console.log("✓ tests/datasets/query-execution.test.js passed successfully.");
})().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
