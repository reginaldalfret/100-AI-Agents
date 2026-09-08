import test from "node:test";
import assert from "node:assert/strict";
import { getModelById } from "../../platform/models/model-registry.js";

test("Gemma Chat — Model Registry Verification", () => {
  const model = getModelById("301-gemma-kaviya-style-v1");
  assert.ok(model);
  assert.equal(model.type, "PERSONAL_STYLE");
  assert.equal(model.base_model, "google/gemma-3-1b-it");
  assert.equal(model.runtime, "TRANSFORMERS_PEFT");
  assert.equal(model.status, "EXPERIMENTAL");
});
