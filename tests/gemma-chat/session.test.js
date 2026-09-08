import test from "node:test";
import assert from "node:assert/strict";
import { PersonalStyleGemmaRuntime } from "../../platform/personal-style/gemma-runtime.js";

test("Gemma Chat — Session Management and History", async () => {
  const runtime = new PersonalStyleGemmaRuntime();
  const sessionA = runtime.getOrCreateSession("session-alpha");
  const sessionB = runtime.getOrCreateSession("session-beta");
  assert.notEqual(sessionA.id, sessionB.id);
  assert.equal(sessionA.history.length, 0);
  await runtime.generate({
    session_id: "session-alpha",
    messages: [{ role: "user", content: "hello" }]
  });
  assert.equal(sessionA.history.length, 2);
  assert.equal(sessionB.history.length, 0);
});
