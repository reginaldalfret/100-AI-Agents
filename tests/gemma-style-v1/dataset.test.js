import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const DATASET_DIR = "E:/Smart Automation/100-AI-Agents/data/fine-tuning/personal-style/kaviya-style-v2";

test("Gemma Style v1 — Sanitized Dataset Split & Quantity Verification", () => {
  const trainFile = path.join(DATASET_DIR, "personal_style_v2_train.jsonl");
  const valFile = path.join(DATASET_DIR, "personal_style_v2_val.jsonl");
  const testFile = path.join(DATASET_DIR, "personal_style_v2_test.jsonl");

  assert.ok(fs.existsSync(trainFile), "Train split must exist");
  assert.ok(fs.existsSync(valFile), "Val split must exist");
  assert.ok(fs.existsSync(testFile), "Test split must exist");

  const train = fs.readFileSync(trainFile, "utf8").trim().split("\n").map(JSON.parse);
  const val = fs.readFileSync(valFile, "utf8").trim().split("\n").map(JSON.parse);
  const testData = fs.readFileSync(testFile, "utf8").trim().split("\n").map(JSON.parse);

  assert.strictEqual(train.length, 558, "Train turns must be exactly 558");
  assert.strictEqual(val.length, 63, "Val turns must be exactly 63");
  assert.strictEqual(testData.length, 67, "Test turns must be exactly 67");

  const trainPrompts = new Set(train.map(x => x.messages[0].content));
  const trainResponses = new Set(train.map(x => x.messages[1].content));

  let contamination = 0;
  for (const t of testData) {
    if (trainPrompts.has(t.messages[0].content) && trainResponses.has(t.messages[1].content)) {
      contamination++;
    }
  }
  assert.strictEqual(contamination, 0, "Train and Test sets must have 0 exact overlap");
});
