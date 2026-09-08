import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  maskPII,
  hasPII,
  detectPII,
  auditDatasetForPII,
  REDACTION_TOKENS
} from "../../platform/personal-style/pii-filter.js";
import { loadJsonl } from "../../platform/personal-style/train-test-separation.js";

const DATASET_DIR = path.resolve("data/fine-tuning/personal-style/kaviya-style-v1");

describe("Deterministic PII Filter Suite", () => {
  it("should deterministically mask Indian mobile and telephone numbers", () => {
    const inputWithPhone = "Contact Dheeraj at 📞 +91 80981 69397 or 8098169397 for inquiries.";
    const masked = maskPII(inputWithPhone);

    assert.ok(!masked.includes("80981"), "Raw phone digits must be masked");
    assert.ok(masked.includes(REDACTION_TOKENS.PHONE), "Masked text must contain phone redaction token");

    // Determinism check: 50 successive runs must produce identical output
    for (let i = 0; i < 50; i++) {
      assert.equal(maskPII(inputWithPhone), masked, "Masking must be strictly deterministic");
    }
  });

  it("should deterministically mask email addresses conforming to RFC-5322", () => {
    const inputWithEmail = "Send project updates to dheerajkothari01@gmail.com and support@codetheory.io please.";
    const masked = maskPII(inputWithEmail);

    assert.ok(!masked.includes("dheerajkothari01@gmail.com"), "Raw email must be masked");
    assert.ok(!masked.includes("support@codetheory.io"), "Raw secondary email must be masked");
    assert.ok(masked.includes(REDACTION_TOKENS.EMAIL));

    // Idempotency: re-running on masked text should not corrupt redaction tokens
    assert.equal(maskPII(masked), masked);
  });

  it("should deterministically mask web URLs and form links", () => {
    const inputWithUrls = "Check https://goutam-textiles01.netlify.app/ or fill https://forms.gle/41jTEwnSMNTHDNGC7.";
    const masked = maskPII(inputWithUrls);

    assert.ok(!masked.includes("goutam-textiles01"), "Netlify URL must be redacted");
    assert.ok(!masked.includes("forms.gle"), "Google Form URL must be redacted");
    assert.ok(masked.includes(REDACTION_TOKENS.URL));
  });

  it("should handle compound messages containing phone, email, and URL simultaneously", () => {
    const rawCompound = [
      "Hi I'm Dheeraj from CodeTheory.",
      "Check our work: https://codetheory01.netlify.app/",
      "Call +91 80981 69397",
      "Email: dheerajkothari01@gmail.com"
    ].join("\n");

    const masked = maskPII(rawCompound);

    assert.ok(!masked.includes("80981 69397"));
    assert.ok(!masked.includes("dheerajkothari01@gmail.com"));
    assert.ok(!masked.includes("https://codetheory01.netlify.app/"));

    assert.ok(masked.includes(REDACTION_TOKENS.PHONE));
    assert.ok(masked.includes(REDACTION_TOKENS.EMAIL));
    assert.ok(masked.includes(REDACTION_TOKENS.URL));
  });

  it("should accurately detect presence of PII entities via hasPII and detectPII", () => {
    const cleanText = "Hey anna unga clg la competitions nadanda sollunga";
    assert.equal(hasPII(cleanText), false);

    const dirtyText = "Call me at +91 98765 43210 or check https://example.com";
    assert.equal(hasPII(dirtyText), true);

    const detected = detectPII(dirtyText);
    assert.equal(detected.hasAny, true);
    assert.equal(detected.phones.length, 1);
    assert.equal(detected.urls.length, 1);
    assert.equal(detected.emails.length, 0);
  });

  it("should verify 0 raw PII leaks across production train, val, and test splits", () => {
    const splits = ["personal_style_train.jsonl", "personal_style_val.jsonl", "personal_style_test.jsonl"];

    for (const split of splits) {
      const p = path.join(DATASET_DIR, split);
      assert.ok(fs.existsSync(p));

      const dataset = loadJsonl(p);
      const audit = auditDatasetForPII(dataset);

      assert.equal(
        audit.clean,
        true,
        `Split ${split} contained PII leaks: ${JSON.stringify(audit.leaks)}`
      );
      assert.equal(audit.leakCount, 0, `Split ${split} must have exactly 0 PII leaks`);
    }
  });
});
