import test from "node:test";
import assert from "node:assert/strict";
import { StreamSanitizer } from "../../platform/models/stream-sanitizer.js";

test("ThinkFilter — real-time token emission latency", () => {
  const sanitizer = new StreamSanitizer();
  
  // Tokens before think tag should emit immediately
  const t1 = sanitizer.push("Immediate token. ");
  assert.equal(t1, "Immediate token. ");

  // Start of think tag should pause visible emission
  const t2 = sanitizer.push("<think>Heavy neural computation...");
  assert.equal(t2, "");

  // Intermediate thinking tokens produce 0 visible output
  const t3 = sanitizer.push("Still thinking... ");
  assert.equal(t3, "");

  // Closing tag allows immediate resumption
  const t4 = sanitizer.push("</think>Final result.");
  assert.equal(t4, "Final result.");
});

test("ThinkFilter — supports alternate reasoning tags like <reasoning>", () => {
  const sanitizer = new StreamSanitizer();
  const chunks = ["<reasoning>Step 1</reasoning>Answer 1"];
  let visible = "";
  for (const c of chunks) visible += sanitizer.push(c);
  visible += sanitizer.flush();
  assert.equal(visible, "Answer 1");
});

test("ThinkFilter — unclosed think tag at stream end", () => {
  const sanitizer = new StreamSanitizer();
  const chunks = ["<think>Never closed reasoning block..."];
  let visible = "";
  for (const c of chunks) visible += sanitizer.push(c);
  visible += sanitizer.flush();
  assert.equal(visible, "");
  assert.ok(sanitizer.getHiddenReasoning().includes("Never closed"));
});
