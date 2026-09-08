import test from "node:test";
import assert from "node:assert/strict";
import { personalStyleGemmaRuntime } from "../../platform/personal-style/gemma-runtime.js";

test("Gemma Chat — No Filesystem or Secret Leak in Health/Status", () => {
  const health = personalStyleGemmaRuntime.health();
  const status = personalStyleGemmaRuntime.status();
  const healthStr = JSON.stringify(health);
  const statusStr = JSON.stringify(status);
  assert.ok(!healthStr.includes("C:\\"));
  assert.ok(!statusStr.includes("C:\\"));
  assert.ok(!healthStr.includes("hf_"));
  assert.ok(!statusStr.includes("hf_"));
});
