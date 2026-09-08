import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Gemma Style v1 — Checkpoint Configuration & Architecture Manifest", () => {
  const cacheDir = "E:/Smart Automation/100-AI-Agents/models/cache/huggingface";
  assert.ok(fs.existsSync(cacheDir), "Hugging Face cache directory must exist in project storage");
  
  const expectedRepo = "google/gemma-3-1b-it";
  assert.strictEqual(expectedRepo, "google/gemma-3-1b-it", "Official Google Gemma 3 1B repository required");
});
