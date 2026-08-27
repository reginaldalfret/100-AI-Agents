import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("Running: tests/ui/domain-specialist-display.test.js");

const htmlPath = path.resolve("platform/web/index.html");
const html = fs.readFileSync(htmlPath, "utf8");

// Verify DOMAIN SPECIALIST section header in HTML
assert.ok(html.includes("DOMAIN SPECIALIST LLMs"), "index.html must include DOMAIN SPECIALIST LLMs section");

// Verify MedGemma 4B card and badges
assert.ok(html.includes("data-model-id=\"medgemma-4b\""), "index.html must include medgemma-4b option");
assert.ok(html.includes("MedGemma 4B"), "index.html must display MedGemma 4B name");
assert.ok(html.includes("HEALTHCARE"), "index.html must display HEALTHCARE badge");
assert.ok(html.includes("MEDICAL AI"), "index.html must display MEDICAL AI badge");

// Verify Qwen3 1.7B Cyber
assert.ok(html.includes("data-model-id=\"qwen3-1.7b-cyber\""), "index.html must include qwen3-1.7b-cyber option");
assert.ok(html.includes("CYBERSECURITY"), "index.html must display CYBERSECURITY badge");

// Verify CSS definitions
const cssPath = path.resolve("platform/web/styles.css");
const css = fs.readFileSync(cssPath, "utf8");
assert.ok(css.includes(".badge-healthcare"), "styles.css must style .badge-healthcare");
assert.ok(css.includes(".badge-medical"), "styles.css must style .badge-medical");

console.log("✓ tests/ui/domain-specialist-display.test.js passed successfully.");
