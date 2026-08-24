import test from "node:test";
import assert from "node:assert/strict";
import { StreamSanitizer } from "../../platform/models/stream-sanitizer.js";

test("UIHiddenReasoning — copy text sanitization", () => {
  const rawResponse = "<think>Internal deliberation</think>Approved for production deployment.";
  const cleanCopy = StreamSanitizer.sanitizeFullText(rawResponse);
  assert.equal(cleanCopy, "Approved for production deployment.");
  assert.ok(!cleanCopy.includes("<think>"));
});

test("UIHiddenReasoning — export formatting sanitization", () => {
  const rawExport = "<think>Analyzing table columns...</think>| Task | Status |\n|---|---|\n| Testing | Complete |";
  const cleanExport = StreamSanitizer.sanitizeFullText(rawExport);
  assert.ok(cleanExport.includes("| Task | Status |"));
  assert.ok(!cleanExport.includes("Analyzing table columns"));
});
