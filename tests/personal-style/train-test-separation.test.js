import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  loadJsonl,
  calculateTurnOverlap,
  validateDatasetSchema,
  verifyTrainTestSeparation,
  DEFAULT_SPLIT_COUNTS
} from "../../platform/personal-style/train-test-separation.js";

const PRIMARY_DATASET_DIR = path.resolve("data/fine-tuning/personal-style/kaviya-style-v1");
const MODEL_DATASET_DIR = path.resolve("models/fine-tuned/personal-style/kaviya-style-v1/dataset");

describe("Train / Val / Test Separation & Integrity Suite", () => {
  it("should confirm the existence of all three dataset split files", () => {
    const trainFile = path.join(PRIMARY_DATASET_DIR, "personal_style_train.jsonl");
    const valFile = path.join(PRIMARY_DATASET_DIR, "personal_style_val.jsonl");
    const testFile = path.join(PRIMARY_DATASET_DIR, "personal_style_test.jsonl");

    assert.ok(fs.existsSync(trainFile), "personal_style_train.jsonl must exist");
    assert.ok(fs.existsSync(valFile), "personal_style_val.jsonl must exist");
    assert.ok(fs.existsSync(testFile), "personal_style_test.jsonl must exist");
  });

  it("should verify exact turn counts: Train = 200, Val = 25, Test = 25 (Total = 250)", () => {
    const trainData = loadJsonl(path.join(PRIMARY_DATASET_DIR, "personal_style_train.jsonl"));
    const valData = loadJsonl(path.join(PRIMARY_DATASET_DIR, "personal_style_val.jsonl"));
    const testData = loadJsonl(path.join(PRIMARY_DATASET_DIR, "personal_style_test.jsonl"));

    assert.equal(trainData.length, DEFAULT_SPLIT_COUNTS.TRAIN, `Train set must have exactly ${DEFAULT_SPLIT_COUNTS.TRAIN} turns`);
    assert.equal(valData.length, DEFAULT_SPLIT_COUNTS.VAL, `Validation set must have exactly ${DEFAULT_SPLIT_COUNTS.VAL} turns`);
    assert.equal(testData.length, DEFAULT_SPLIT_COUNTS.TEST, `Test set must have exactly ${DEFAULT_SPLIT_COUNTS.TEST} turns`);

    const total = trainData.length + valData.length + testData.length;
    assert.equal(total, DEFAULT_SPLIT_COUNTS.TOTAL, `Total combined turns must be exactly ${DEFAULT_SPLIT_COUNTS.TOTAL}`);
  });

  it("should enforce valid ChatML / OpenAI JSON schema across every record", () => {
    const splits = ["personal_style_train.jsonl", "personal_style_val.jsonl", "personal_style_test.jsonl"];

    for (const split of splits) {
      const data = loadJsonl(path.join(PRIMARY_DATASET_DIR, split));
      const schemaCheck = validateDatasetSchema(data);

      assert.equal(
        schemaCheck.valid,
        true,
        `Split ${split} failed schema validation: ${JSON.stringify(schemaCheck.errors)}`
      );
      assert.equal(schemaCheck.errorCount, 0);
    }
  });

  it("should prove 0 exact overlap between Train and Validation sets (0.00% contamination)", () => {
    const trainData = loadJsonl(path.join(PRIMARY_DATASET_DIR, "personal_style_train.jsonl"));
    const valData = loadJsonl(path.join(PRIMARY_DATASET_DIR, "personal_style_val.jsonl"));

    const overlap = calculateTurnOverlap(trainData, valData);
    assert.equal(overlap.overlapCount, 0, "Train and Val must share 0 exact dialogue turns");
    assert.equal(overlap.contaminationRate, 0.0);
    assert.equal(overlap.isClean, true);
  });

  it("should prove 0 exact overlap between Train and Test sets (0.00% contamination)", () => {
    const trainData = loadJsonl(path.join(PRIMARY_DATASET_DIR, "personal_style_train.jsonl"));
    const testData = loadJsonl(path.join(PRIMARY_DATASET_DIR, "personal_style_test.jsonl"));

    const overlap = calculateTurnOverlap(trainData, testData);
    assert.equal(overlap.overlapCount, 0, "Train and Test must share 0 exact dialogue turns");
    assert.equal(overlap.contaminationRate, 0.0);
    assert.equal(overlap.isClean, true);
  });

  it("should prove 0 exact overlap between Validation and Test sets", () => {
    const valData = loadJsonl(path.join(PRIMARY_DATASET_DIR, "personal_style_val.jsonl"));
    const testData = loadJsonl(path.join(PRIMARY_DATASET_DIR, "personal_style_test.jsonl"));

    const overlap = calculateTurnOverlap(valData, testData);
    assert.equal(overlap.overlapCount, 0, "Val and Test must share 0 exact dialogue turns");
    assert.equal(overlap.contaminationRate, 0.0);
    assert.equal(overlap.isClean, true);
  });

  it("should execute end-to-end split verification report with complete success", () => {
    const report = verifyTrainTestSeparation(PRIMARY_DATASET_DIR);

    assert.equal(report.success, true);
    assert.equal(report.countsMatch, true);
    assert.equal(report.overlaps.zeroOverlap, true);
    assert.equal(report.schemas.trainValid, true);
    assert.equal(report.schemas.valValid, true);
    assert.equal(report.schemas.testValid, true);
  });

  it("should verify mirror copies in models/fine-tuned/personal-style/kaviya-style-v1/dataset if present", () => {
    if (fs.existsSync(MODEL_DATASET_DIR)) {
      const modelReport = verifyTrainTestSeparation(MODEL_DATASET_DIR);
      assert.equal(modelReport.success, true);
      assert.equal(modelReport.counts.train, 200);
      assert.equal(modelReport.counts.val, 25);
      assert.equal(modelReport.counts.test, 25);
      assert.equal(modelReport.overlaps.zeroOverlap, true);
    }
  });
});
