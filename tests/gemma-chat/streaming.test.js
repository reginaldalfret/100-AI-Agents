import test from "node:test";
import assert from "node:assert/strict";
import { personalStyleGemmaRuntime } from "../../platform/personal-style/gemma-runtime.js";

test("Gemma Chat — SSE Token Streaming", async () => {
  const tokens = [];
  let doneResult = null;
  await personalStyleGemmaRuntime.stream_generate({
    session_id: "test-gen-stream",
    model: "301-gemma-kaviya-style-v1",
    messages: [{ role: "user", content: "what are you doing this weekend?" }],
    onToken: (tok) => tokens.push(tok),
    onDone: (res) => { doneResult = res; }
  });
  assert.ok(tokens.length > 0, "Tokens must be emitted");
  assert.ok(doneResult, "Done event must be triggered");
  assert.equal(doneResult.session_id, "test-gen-stream");
  assert.ok(doneResult.fullText.length > 0);
});
