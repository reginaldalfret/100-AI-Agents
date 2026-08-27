import assert from "node:assert";
import { parseCSV } from "../../platform/datasets/dataset-parser.js";
import { profileDataset, inferSqlType } from "../../platform/datasets/schema-profiler.js";

console.log("Running: tests/datasets/schema-profiler.test.js");

// Type inference tests
assert.strictEqual(inferSqlType(["10", "20", "300"]), "INTEGER");
assert.strictEqual(inferSqlType(["10.5", "20.2", "300.0"]), "REAL");
assert.strictEqual(inferSqlType(["true", "false", "true"]), "BOOLEAN");
assert.strictEqual(inferSqlType(["2026-07-01", "2026-07-02", "2026-07-03"]), "DATE");
assert.strictEqual(inferSqlType(["Plant A", "Plant B", "Plant C"]), "TEXT");

const sampleData = `unit,temperature,pressure,timestamp,is_nominal
Unit 1,120.5,45,2026-07-01,true
Unit 2,135.0,52,2026-07-02,false
Unit 1,120.5,45,2026-07-01,true
Unit 3,,60,2026-07-03,true`;

const parsed = parseCSV(sampleData);
const profile = profileDataset(parsed);

assert.strictEqual(profile.rowCount, 4);
assert.strictEqual(profile.columnCount, 5);
assert.strictEqual(profile.duplicateRows, 1, "Must detect 1 duplicate row");

// Check null count on temperature (Unit 3 has empty temperature)
const tempCol = profile.columns.find(c => c.sqlName === "temperature");
assert.ok(tempCol);
assert.strictEqual(tempCol.nullCount, 1);
assert.strictEqual(tempCol.type, "REAL");

console.log("✓ tests/datasets/schema-profiler.test.js passed successfully.");
