import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Gemma Style v1 — Output Directory Structure Standard", () => {
  const baseOutputDir = "E:/Smart Automation/100-AI-Agents/models/fine-tuned/personal-style/gemma-kaviya-style-v1";
  const requiredSubdirs = ["adapter", "checkpoints", "evaluation", "metadata", "logs", "reports"];

  for (const sub of requiredSubdirs) {
    const fullPath = path.join(baseOutputDir, sub);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    assert.ok(fs.existsSync(fullPath), `Subdirectory ${sub} must exist`);
  }
});
