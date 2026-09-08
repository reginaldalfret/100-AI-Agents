import test from "node:test";
import assert from "node:assert/strict";

function computeStyleMetrics(responses) {
  if (!responses.length) return {};
  const lens = responses.map(r => r.length);
  const avgLen = lens.reduce((a, b) => a + b, 0) / lens.length;
  const lowerCount = responses.filter(r => r === r.toLowerCase() && r.length > 0).length;
  const emojiCount = responses.filter(r => /\p{Emoji}/u.test(r)).length;

  return {
    avgLength: Math.round(avgLen * 10) / 10,
    lowercaseRatio: Math.round((lowerCount / responses.length) * 100) / 100,
    emojiRatio: Math.round((emojiCount / responses.length) * 100) / 100
  };
}

test("Gemma Style v1 — Style Metrics Calculation Engine", () => {
  const sampleStyleOutputs = [
    "ha ha sure ill be there 👍",
    "seri da see u soon",
    "enna panra?"
  ];

  const metrics = computeStyleMetrics(sampleStyleOutputs);
  assert.ok(metrics.avgLength > 0, "Average length should be calculated");
  assert.strictEqual(metrics.lowercaseRatio, 1.0, "All lowercase inputs should produce 1.0 lowercase ratio");
  assert.ok(metrics.emojiRatio > 0, "Emoji presence should be detected");
});
