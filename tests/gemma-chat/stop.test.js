import test from "node:test";
import assert from "node:assert/strict";
import { PersonalStyleGemmaRuntime } from "../../platform/personal-style/gemma-runtime.js";

test("Gemma Chat — Abort and Stop In-Flight Generation", async () => {
  const runtime = new PersonalStyleGemmaRuntime();
  const resEmpty = runtime.stop("non-existent-session");
  assert.equal(resEmpty.success, false);
  assert.equal(resEmpty.message, "No active generation found.");
});
