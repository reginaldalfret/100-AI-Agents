import test from "node:test";
import assert from "node:assert/strict";
import { PersonalStyleGemmaRuntime } from "../../platform/personal-style/gemma-runtime.js";

test("Gemma Chat — Concurrency Mutex Queue", async () => {
  const runtime = new PersonalStyleGemmaRuntime();
  let callOrder = [];
  const task1 = runtime.enqueueGeneration(async () => {
    await new Promise(r => setTimeout(r, 40));
    callOrder.push(1);
    return "one";
  });
  const task2 = runtime.enqueueGeneration(async () => {
    callOrder.push(2);
    return "two";
  });
  const [r1, r2] = await Promise.all([task1, task2]);
  assert.equal(r1, "one");
  assert.equal(r2, "two");
  assert.deepEqual(callOrder, [1, 2]);
});
