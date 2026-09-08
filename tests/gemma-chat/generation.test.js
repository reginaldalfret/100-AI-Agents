import test from "node:test";
import assert from "node:assert/strict";
import { personalStyleGemmaRuntime } from "../../platform/personal-style/gemma-runtime.js";

test("Gemma Chat — Synchronous Generation", async () => {
  const res = await personalStyleGemmaRuntime.generate({
    session_id: "test-gen-sync",
    model: "301-gemma-kaviya-style-v1",
    messages: [{ role: "user", content: "what are you doing today?" }]
  });
  assert.equal(res.session_id, "test-gen-sync");
  assert.equal(res.model, "301-gemma-kaviya-style-v1");
  assert.ok(res.response.length > 0);
  assert.ok(res.response.includes("work") || res.response.includes("rest") || res.response.includes("da"));
});
