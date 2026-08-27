import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("Running: tests/ui/dataset-analysis.test.js");

const html = fs.readFileSync(path.resolve("platform/web/index.html"), "utf8");

// Check Datasets navigation item and views
assert.ok(html.includes("DATASETS") || html.includes("datasets") || html.includes("filesView"), "UI must have dataset navigation or file views");

console.log("✓ tests/ui/dataset-analysis.test.js passed successfully.");
