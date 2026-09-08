import test from "node:test";
import assert from "node:assert/strict";

test("Gemma Style v1 — SSE Streaming Protocol Format", () => {
  const sampleSseChunk = "data: {\"token\": \"hello\", \"done\": false}\n\n";
  const lines = sampleSseChunk.trim().split("\n");
  assert.ok(lines[0].startsWith("data: "));
  const payload = JSON.parse(lines[0].replace("data: ", ""));
  assert.strictEqual(payload.token, "hello");
  assert.strictEqual(payload.done, false);
});
