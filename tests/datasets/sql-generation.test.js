import assert from "node:assert";
import { generateDeterministicSQL } from "../../platform/datasets/sql-generator.js";

console.log("Running: tests/datasets/sql-generation.test.js");

const mockSchema = {
  columns: [
    { sqlName: "plant", originalName: "Plant Name", type: "TEXT", sampleValues: ["Plant A", "Plant B"] },
    { sqlName: "product", originalName: "Product Type", type: "TEXT", sampleValues: ["Diesel", "Petrol"] },
    { sqlName: "production_tons", originalName: "Production (Tons)", type: "REAL", sampleValues: [1200, 1500] }
  ]
};

// 1. Total rows question
const sqlCount = generateDeterministicSQL("How many rows are in the dataset?", mockSchema);
assert.ok(sqlCount.includes("COUNT(*)"), "Must generate COUNT(*)");

// 2. Highest production plant
const sqlHighest = generateDeterministicSQL("Which plant had the highest production?", mockSchema);
assert.ok(sqlHighest.includes("GROUP BY \"plant\""), "Must group by plant");
assert.ok(sqlHighest.includes("ORDER BY") && sqlHighest.includes("DESC"), "Must order by DESC for highest");

// 3. Average production
const sqlAvg = generateDeterministicSQL("What was the average production across all units?", mockSchema);
assert.ok(sqlAvg.includes("AVG(\"production_tons\")"), "Must compute AVG(production_tons)");

// 4. Sum with filter
const sqlFilter = generateDeterministicSQL("What was total production for Diesel?", mockSchema);
assert.ok(sqlFilter.includes("SUM(\"production_tons\")"), "Must sum production tons");
assert.ok(sqlFilter.includes("WHERE") && sqlFilter.includes("diesel"), "Must filter by product diesel");

console.log("✓ tests/datasets/sql-generation.test.js passed successfully.");
