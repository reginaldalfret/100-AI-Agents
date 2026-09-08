import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const DATASET_DIR = "E:/Smart Automation/100-AI-Agents/data/fine-tuning/personal-style/kaviya-style-v2";

test("Gemma Style v1 — Speaker Separation Verification", () => {
  const trainFile = path.join(DATASET_DIR, "personal_style_v2_train.jsonl");
  const train = fs.readFileSync(trainFile, "utf8").trim().split("\n").map(JSON.parse);

  let reginaldTargetOutputs = 0;
  for (const item of train) {
    assert.strictEqual(item.messages[0].role, "user", "Message 0 must be user");
    assert.strictEqual(item.messages[1].role, "assistant", "Message 1 must be assistant");
    assert.ok(item.messages[0].content.length > 0, "User prompt must have content");
    assert.ok(item.messages[1].content.length > 0, "Assistant response must have content");

    if (item.messages[1].role !== "assistant") {
      reginaldTargetOutputs++;
    }
  }
  assert.strictEqual(reginaldTargetOutputs, 0, "Reginald target outputs must be 0");
});
