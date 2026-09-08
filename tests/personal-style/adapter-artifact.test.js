import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  verifyArtifactDirectoryTree,
  verifyStyleProfile,
  computeStyleProfile,
  REQUIRED_ARTIFACT_SUBDIRS,
  CORE_STYLISTIC_MARKERS
} from "../../platform/personal-style/adapter-artifact.js";
import { loadJsonl } from "../../platform/personal-style/train-test-separation.js";

const ARTIFACT_DIR = path.resolve("models/fine-tuned/personal-style/kaviya-style-v1");
const STYLE_PROFILE_PATH = path.join(ARTIFACT_DIR, "metadata", "style-profile.json");
const TRAIN_DATA_PATH = path.resolve("data/fine-tuning/personal-style/kaviya-style-v1/personal_style_train.jsonl");

describe("Adapter Artifact & Style Profile Suite", () => {
  it("should confirm the presence of all required artifact subdirectories", () => {
    assert.ok(fs.existsSync(ARTIFACT_DIR), "Artifact root directory must exist");

    const treeCheck = verifyArtifactDirectoryTree(ARTIFACT_DIR);
    assert.equal(
      treeCheck.valid,
      true,
      `Missing artifact directories: ${JSON.stringify(treeCheck.missingDirs)}`
    );

    for (const sub of REQUIRED_ARTIFACT_SUBDIRS) {
      assert.ok(
        treeCheck.foundDirs.includes(sub),
        `Directory '${sub}' must exist under ${ARTIFACT_DIR}`
      );
    }
  });

  it("should validate the serialized style-profile.json schema and empirical values", () => {
    assert.ok(fs.existsSync(STYLE_PROFILE_PATH), "style-profile.json must exist in metadata/");

    const raw = fs.readFileSync(STYLE_PROFILE_PATH, "utf-8");
    const profile = JSON.parse(raw);

    const check = verifyStyleProfile(profile);
    assert.equal(check.valid, true, `Style profile validation failed: ${JSON.stringify(check.errors)}`);

    // Verify key empirical metrics
    assert.equal(profile.experiment_id, "kaviya-style-v1");
    assert.equal(profile.sample_size, 200);
    assert.equal(profile.average_message_length_chars, 32);
    assert.equal(profile.average_words_per_message, 6);
    assert.equal(profile.lowercase_char_ratio, 0.948);

    // Verify code-switching indicators
    assert.equal(profile.code_switching_indicators.tamil_english_mixing, true);
    assert.equal(profile.code_switching_indicators.malayalam_english_mixing, true);

    // Verify frequent stylistic markers
    const markers = profile.frequent_stylistic_markers;
    assert.ok(markers.anna >= 20, `Marker 'anna' count expected >= 20, got ${markers.anna}`);
    assert.ok(markers.adhu >= 5, `Marker 'adhu' count expected >= 5, got ${markers.adhu}`);
    assert.ok(markers.dhan >= 5, `Marker 'dhan' count expected >= 5, got ${markers.dhan}`);
  });

  it("should dynamically compute and verify style profile from production train split", () => {
    assert.ok(fs.existsSync(TRAIN_DATA_PATH));

    const trainTurns = loadJsonl(TRAIN_DATA_PATH);
    const computed = computeStyleProfile(trainTurns, "kaviya-style-v1");

    assert.equal(computed.sample_size, 200);
    assert.ok(computed.lowercase_char_ratio > 0.9, `Lowercase ratio must be > 0.9, got ${computed.lowercase_char_ratio}`);
    assert.ok(computed.average_words_per_message > 0);
    assert.ok(computed.average_message_length_chars > 0);

    // Check that core stylistic markers are discovered in the corpus
    const discovered = computed.frequent_stylistic_markers;
    const totalFoundMarkers = Object.values(discovered).reduce((a, b) => a + b, 0);
    assert.ok(totalFoundMarkers > 10, "Corpus must contain significant presence of dialect/style markers");
  });

  it("should verify air-gap and hardware governance specification contract", () => {
    const experimentDocPath = path.resolve("docs/ml/experiments/kaviya-style-v1.md");
    assert.ok(fs.existsSync(experimentDocPath), "Experiment report markdown must exist");

    const docContent = fs.readFileSync(experimentDocPath, "utf-8");

    // Airgap and sovereign guarantees
    assert.ok(docContent.includes("AIR-GAP STATUS: CERTIFIED") || docContent.includes("Air-Gap Status: CERTIFIED"));
    assert.ok(docContent.includes("0 external network calls"));

    // Base model and hardware specs
    assert.ok(docContent.includes("SmolLM2-360M-Instruct"));
    assert.ok(docContent.includes("RTX 2050"));
    assert.ok(docContent.includes("301-kaviya-style-v1"));
  });
});
