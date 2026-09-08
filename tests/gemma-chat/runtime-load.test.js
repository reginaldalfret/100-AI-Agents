import test from "node:test";
import assert from "node:assert/strict";
import { PersonalStyleGemmaRuntime } from "../../platform/personal-style/gemma-runtime.js";

test("Gemma Chat — Runtime Lifecycle and Instantiation", async () => {
  const runtime = new PersonalStyleGemmaRuntime();
  assert.equal(runtime.modelId, "301-gemma-kaviya-style-v1");
  assert.equal(runtime.displayName, "Gemma Kaviya Communication Style v1");
  assert.equal(runtime.baseModelId, "google/gemma-3-1b-it");

  const initRes = await runtime.initialize();
  assert.equal(initRes.status, "READY");

  const health = runtime.health();
  assert.equal(health.model, "301-gemma-kaviya-style-v1");
  assert.equal(health.local_only, true);

  const status = runtime.status();
  assert.equal(status.model, "301-gemma-kaviya-style-v1");
  assert.equal(status.base_model, "google/gemma-3-1b-it");
  assert.equal(typeof status.active_sessions, "number");
});
