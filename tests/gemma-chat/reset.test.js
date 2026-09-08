import test from "node:test";
import assert from "node:assert/strict";
import { PersonalStyleGemmaRuntime } from "../../platform/personal-style/gemma-runtime.js";

test("Gemma Chat — Session History Reset", async () => {
  const runtime = new PersonalStyleGemmaRuntime();
  await runtime.generate({
    session_id: "session-to-reset",
    messages: [{ role: "user", content: "test message" }]
  });
  const sessionBefore = runtime.getOrCreateSession("session-to-reset");
  assert.ok(sessionBefore.history.length > 0);
  const res = runtime.reset_session("session-to-reset");
  assert.equal(res.success, true);
  const sessionAfter = runtime.getOrCreateSession("session-to-reset");
  assert.equal(sessionAfter.history.length, 0);
});
