import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("Running: tests/ui/finetuning-factory.test.js");

const html = fs.readFileSync(path.resolve("platform/web/index.html"), "utf8");

assert.ok(
  html.includes("Fine-Tuning") || html.includes("finetuning") || html.includes("modelsView") || html.includes("FINE-TUNING"),
  "Fine-Tuning factory navigation or panel must be present"
);

console.log("✓ tests/ui/finetuning-factory.test.js passed successfully.");
