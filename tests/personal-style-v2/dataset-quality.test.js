import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const V2_DATASET_DIR = "E:/Smart Automation/100-AI-Agents/data/fine-tuning/personal-style/kaviya-style-v2";

test("Personal Style v2 — Dataset Quantity & Split Integrity", () => {
  const trainFile = path.join(V2_DATASET_DIR, "personal_style_v2_train.jsonl");
  const valFile = path.join(V2_DATASET_DIR, "personal_style_v2_val.jsonl");
  const testFile = path.join(V2_DATASET_DIR, "personal_style_v2_test.jsonl");

  assert.ok(fs.existsSync(trainFile), "Train split must exist");
  assert.ok(fs.existsSync(valFile), "Val split must exist");
  assert.ok(fs.existsSync(testFile), "Test split must exist");

  const train = fs.readFileSync(trainFile, "utf8").trim().split("\n").map(JSON.parse);
  const val = fs.readFileSync(valFile, "utf8").trim().split("\n").map(JSON.parse);
  const testData = fs.readFileSync(testFile, "utf8").trim().split("\n").map(JSON.parse);

  assert.ok(train.length >= 450, `Train turns (${train.length}) must be expanded beyond v1 limits (>= 450)`);
  assert.ok(val.length >= 50, `Val turns (${val.length}) must be >= 50`);
  assert.ok(testData.length >= 50, `Test turns (${testData.length}) must be >= 50`);

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

test("Personal Style v2 — Speaker Separation (Reginald = Context, Kaviya = Target)", () => {
  const trainFile = path.join(V2_DATASET_DIR, "personal_style_v2_train.jsonl");
  const train = fs.readFileSync(trainFile, "utf8").trim().split("\n").map(JSON.parse);

  for (const item of train) {
    assert.strictEqual(item.messages[0].role, "user");
    assert.strictEqual(item.messages[1].role, "assistant");
    assert.ok(item.messages[0].content.length > 0);
    assert.ok(item.messages[1].content.length > 0);
  }
});

test("Personal Style v2 — Strict Exclusion of Sensitive & Trauma Content", () => {
  const trainFile = path.join(V2_DATASET_DIR, "personal_style_v2_train.jsonl");
  const train = fs.readFileSync(trainFile, "utf8").trim().split("\n").map(JSON.parse);

  const forbiddenTerms = ["self harm", "suicide", "kill myself", "sexual", "touched me", "harass", "trauma", "horny", "erection", "b**bs", "d*ck"];

  for (const item of train) {
    const text = (item.messages[0].content + " " + item.messages[1].content).toLowerCase();
    for (const term of forbiddenTerms) {
      assert.ok(!text.includes(term), `Forbidden sensitive term '${term}' found in training split!`);
    }
  }
});
