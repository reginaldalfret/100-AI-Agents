import test from "node:test";
import assert from "node:assert/strict";

test("Gemma Style v1 — General Capability Evaluation Matrix", () => {
  const probes = [
    { task: "Arithmetic", prompt: "What is 15 plus 28?", expected: "43" },
    { task: "Reasoning", prompt: "If a bird has 2 wings, how many wings do 3 birds have?", expected: "6" },
    { task: "Summarization", prompt: "Summarize: The sun rises in east and sets in west.", expected: "east" }
  ];

  assert.strictEqual(probes.length, 3);
  for (const p of probes) {
    assert.ok(p.task);
    assert.ok(p.prompt);
    assert.ok(p.expected);
  }
});
