import assert from "node:assert";
import { ingestDatasetFile, deleteDataset } from "../../platform/datasets/dataset-registry.js";
import { executeDatasetSQL } from "../../platform/datasets/sql-engine.js";

console.log("Running: tests/datasets/read-only-security.test.js");

const sampleCsv = `id,name,value\n1,Alpha,100\n2,Beta,200`;

(async () => {
  const dataset = await ingestDatasetFile({
    filename: "sec_test.csv",
    buffer: Buffer.from(sampleCsv, "utf8")
  });

  // Attempt DROP TABLE
  assert.throws(() => {
    executeDatasetSQL(dataset.dataset_id, "DROP TABLE dataset");
  }, /SECURITY_VIOLATION/);

  // Attempt DELETE
  assert.throws(() => {
    executeDatasetSQL(dataset.dataset_id, "DELETE FROM dataset WHERE id = 1");
  }, /SECURITY_VIOLATION/);

  // Attempt UPDATE
  assert.throws(() => {
    executeDatasetSQL(dataset.dataset_id, "UPDATE dataset SET value = 999");
  }, /SECURITY_VIOLATION/);

  // Attempt INSERT
  assert.throws(() => {
    executeDatasetSQL(dataset.dataset_id, "INSERT INTO dataset VALUES (3, 'Gamma', 300)");
  }, /SECURITY_VIOLATION/);

  // Attempt Stacked Query
  assert.throws(() => {
    executeDatasetSQL(dataset.dataset_id, "SELECT * FROM dataset; DROP TABLE dataset;");
  }, /SECURITY_VIOLATION/);

  deleteDataset(dataset.dataset_id);
  console.log("✓ tests/datasets/read-only-security.test.js passed successfully.");
})().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
