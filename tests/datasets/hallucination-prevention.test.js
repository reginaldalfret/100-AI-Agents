import assert from "node:assert";
import { enhanceResultWithLLM } from "../../platform/datasets/dataset-analyst-agent.js";

console.log("Running: tests/datasets/hallucination-prevention.test.js");

(async () => {
  // Empty result test - should NOT invent numbers
  const answer = await enhanceResultWithLLM({
    question: "What is the secret nuclear reactor output?",
    schema: { columns: [{ sqlName: "plant" }, { sqlName: "diesel" }] },
    sql: "SELECT * FROM dataset WHERE secret_reactor IS NOT NULL",
    result: [], // empty database result
    filename: "MRPL_Production.csv"
  });

  assert.strictEqual(answer, "That information is not available in the selected dataset.");

  console.log("✓ tests/datasets/hallucination-prevention.test.js passed successfully.");
})().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
