import assert from "node:assert";
import { enhanceResultWithLLM } from "../../platform/datasets/dataset-analyst-agent.js";

console.log("Running: tests/datasets/llm-enhancement.test.js");

(async () => {
  const verifiedResult = [
    { plant: "Plant A", total_production: 1248430 }
  ];

  const answer = await enhanceResultWithLLM({
    question: "Which plant had the highest production?",
    schema: { columns: [{ sqlName: "plant" }, { sqlName: "total_production" }] },
    sql: "SELECT plant, SUM(production) as total_production FROM dataset GROUP BY plant ORDER BY total_production DESC LIMIT 1",
    result: verifiedResult,
    filename: "MRPL_Production_2026.xlsx"
  });

  assert.ok(typeof answer === "string" && answer.length > 0, "LLM must return non-empty explanation");
  // Check that the answer references the verified data or plant
  assert.ok(answer.includes("Plant A") || answer.includes("1248430") || answer.includes("1,248,430") || answer.includes("highest"), "Answer must cite verified query findings");

  console.log("✓ tests/datasets/llm-enhancement.test.js passed successfully.");
})().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
