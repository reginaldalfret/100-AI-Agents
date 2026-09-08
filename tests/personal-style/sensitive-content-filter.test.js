import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  classifySensitiveContent,
  isSensitiveText,
  filterSensitiveTurns,
  auditDatasetForSensitiveContent,
  SENSITIVE_CATEGORIES
} from "../../platform/personal-style/sensitive-content-filter.js";
import { loadJsonl } from "../../platform/personal-style/train-test-separation.js";

const DATASET_DIR = path.resolve("data/fine-tuning/personal-style/kaviya-style-v1");

describe("Sensitive Content & Safety Filter Suite", () => {
  it("should classify trauma and psychological distress disclosures as sensitive", () => {
    const traumaText = "I had a severe panic attack yesterday and a mental breakdown regarding acute trauma.";
    const result = classifySensitiveContent(traumaText);

    assert.equal(result.isSensitive, true);
    assert.ok(result.categories.includes(SENSITIVE_CATEGORIES.TRAUMA_DISCLOSURE));
    assert.equal(isSensitiveText(traumaText), true);
  });

  it("should classify self-harm and suicidal ideation as sensitive", () => {
    const selfHarmText = "I felt like I wanted to commit suicide and kill myself.";
    const result = classifySensitiveContent(selfHarmText);

    assert.equal(result.isSensitive, true);
    assert.ok(result.categories.includes(SENSITIVE_CATEGORIES.SELF_HARM));
  });

  it("should classify explicit NSFW and sexual harassment content as sensitive", () => {
    const explicitText = "Unsolicited pornographic content and harassment.";
    const result = classifySensitiveContent(explicitText);

    assert.equal(result.isSensitive, true);
    assert.ok(result.categories.includes(SENSITIVE_CATEGORIES.EXPLICIT_CONTENT));
  });

  it("should classify financial credentials and authentication secrets as sensitive", () => {
    const credText = "Your netbanking password is secret and OTP is 482910";
    const result = classifySensitiveContent(credText);

    assert.equal(result.isSensitive, true);
    assert.ok(result.categories.includes(SENSITIVE_CATEGORIES.FINANCIAL_CREDENTIALS));
  });

  it("should allow harmless, everyday conversational turns to pass clean", () => {
    const harmlessTurns = [
      "vanakkam makkaleh! how was the school event?",
      "prior ah solluringala, so that it would b easy to talk with princi",
      "btw en frd dhan cultural secretary",
      "The little life book pathi ketten",
      "What are you doing today?"
    ];

    for (const text of harmlessTurns) {
      assert.equal(isSensitiveText(text), false, `Text '${text}' should not be flagged as sensitive`);
    }
  });

  it("should completely exclude sensitive conversational turns rather than retaining or masking them", () => {
    const sampleCorpus = [
      {
        messages: [
          { role: "user", content: "Ipoo 12th thane nee" },
          { role: "assistant", content: "btw en frd dhan cultural secretary" }
        ]
      },
      {
        messages: [
          { role: "user", content: "I am having severe acute trauma and a mental breakdown" },
          { role: "assistant", content: "Please talk to a doctor anna" }
        ]
      },
      {
        messages: [
          { role: "user", content: "Where are you going?" },
          { role: "assistant", content: "I wanted to kill myself yesterday" }
        ]
      },
      {
        messages: [
          { role: "user", content: "Competitions epo start aagum" },
          { role: "assistant", content: "Next week anna" }
        ]
      }
    ];

    const { cleanTurns, excludedTurns, stats } = filterSensitiveTurns(sampleCorpus);

    assert.equal(cleanTurns.length, 2, "Only 2 harmless turns should be retained");
    assert.equal(excludedTurns.length, 2, "2 turns with sensitive content must be excluded");
    assert.equal(stats.totalInput, 4);
    assert.equal(stats.retainedCount, 2);
    assert.equal(stats.excludedCount, 2);

    // Verify reason tracking
    assert.ok(excludedTurns[0].reasons.includes(SENSITIVE_CATEGORIES.TRAUMA_DISCLOSURE));
    assert.ok(excludedTurns[1].reasons.includes(SENSITIVE_CATEGORIES.SELF_HARM));
  });

  it("should audit and verify 0 trauma or self-harm content in production training split", () => {
    const trainPath = path.join(DATASET_DIR, "personal_style_train.jsonl");
    assert.ok(fs.existsSync(trainPath));

    const trainDataset = loadJsonl(trainPath);
    const audit = auditDatasetForSensitiveContent(trainDataset, [
      SENSITIVE_CATEGORIES.TRAUMA_DISCLOSURE,
      SENSITIVE_CATEGORIES.SELF_HARM,
      SENSITIVE_CATEGORIES.FINANCIAL_CREDENTIALS
    ]);

    assert.equal(
      audit.passed,
      true,
      `Production train split contained prohibited sensitive turns: ${JSON.stringify(audit.violations)}`
    );
    assert.equal(audit.violationCount, 0);
  });
});
