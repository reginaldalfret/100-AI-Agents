import assert from "node:assert";
import { validateReadOnlySQL } from "../../platform/datasets/sql-engine.js";

console.log("Running: tests/datasets/sql-validation.test.js");

// Valid SELECT queries
const valid1 = validateReadOnlySQL("SELECT * FROM dataset WHERE production > 1000");
assert.strictEqual(valid1.valid, true);

const valid2 = validateReadOnlySQL("WITH summary AS (SELECT plant, SUM(production) as s FROM dataset GROUP BY plant) SELECT * FROM summary");
assert.strictEqual(valid2.valid, true);

// Invalid Mutation Queries
const invalidDrop = validateReadOnlySQL("DROP TABLE dataset");
assert.strictEqual(invalidDrop.valid, false);

const invalidDelete = validateReadOnlySQL("DELETE FROM dataset WHERE id = 1");
assert.strictEqual(invalidDelete.valid, false);

const invalidUpdate = validateReadOnlySQL("UPDATE dataset SET production = 0");
assert.strictEqual(invalidUpdate.valid, false);

const invalidInsert = validateReadOnlySQL("INSERT INTO dataset VALUES (1, 2, 3)");
assert.strictEqual(invalidInsert.valid, false);

const invalidMultiple = validateReadOnlySQL("SELECT * FROM dataset; DROP TABLE dataset;");
assert.strictEqual(invalidMultiple.valid, false);

console.log("✓ tests/datasets/sql-validation.test.js passed successfully.");
