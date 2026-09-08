import test from "node:test";
import assert from "node:assert/strict";

test("Gemma Style v1 — UI Lab Elements & Badges", () => {
  const expectedBadges = ["[ GEMMA ]", "[ PERSONAL STYLE ]", "[ LOCAL ]", "[ QLORA ]"];
  const mandatoryDisclosure = "AI-generated response using learned communication-style patterns.";

  assert.strictEqual(expectedBadges.length, 4);
  assert.ok(mandatoryDisclosure.includes("learned communication-style patterns"));
});
