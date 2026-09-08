import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const DATASET_DIR = "E:/Smart Automation/100-AI-Agents/data/fine-tuning/personal-style/kaviya-style-v2";

test("Gemma Style v1 — Deterministic PII & Sensitive Content Filtering", () => {
  const trainFile = path.join(DATASET_DIR, "personal_style_v2_train.jsonl");
  const train = fs.readFileSync(trainFile, "utf8").trim().split("\n").map(JSON.parse);

  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const forbiddenSensitive = ["suicide", "kill myself", "sexual harassment", "touched me", "self harm"];

  for (const item of train) {
    const text = (item.messages[0].content + " " + item.messages[1].content);
    assert.strictEqual(emailRegex.test(text), false, "Raw email detected in training data");
    for (const term of forbiddenSensitive) {
      assert.strictEqual(text.toLowerCase().includes(term), false, `Sensitive term '${term}' found in training data`);
    }
  }
});
