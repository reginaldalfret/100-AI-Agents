import test from "node:test";
import assert from "node:assert/strict";
import { StreamSanitizer, SanitizerState } from "../../platform/models/stream-sanitizer.js";

test("StreamSanitizer — initial state and basic properties", () => {
  const sanitizer = new StreamSanitizer();
  assert.equal(sanitizer.state, SanitizerState.ANSWER);
  assert.equal(sanitizer.getVisibleText(), "");
  assert.equal(sanitizer.getHiddenReasoning(), "");
});

test("StreamSanitizer — standard <think> block inside chunk", () => {
  const sanitizer = new StreamSanitizer();
  const chunk = "<think>Step 1: calculate. Step 2: verify.</think>The final answer is 42.";
  const emitted = sanitizer.push(chunk) + sanitizer.flush();
  
  assert.equal(emitted, "The final answer is 42.");
  assert.equal(sanitizer.getVisibleText(), "The final answer is 42.");
  assert.ok(sanitizer.getHiddenReasoning().includes("calculate"));
});

test("StreamSanitizer — <think> marker split across chunks", () => {
  const sanitizer = new StreamSanitizer();
  const chunks = ["<th", "ink>", "Internal thought process", "</think>", "Hello World"];
  
  let visible = "";
  for (const c of chunks) {
    visible += sanitizer.push(c);
  }
  visible += sanitizer.flush();

  assert.equal(visible, "Hello World");
  assert.ok(!visible.includes("<think>"));
  assert.ok(!visible.includes("Internal thought"));
});

test("StreamSanitizer — </think> end marker split across chunks", () => {
  const sanitizer = new StreamSanitizer();
  const chunks = ["<think>Thinking...", "</", "thi", "nk>", "Direct answer text"];
  
  let visible = "";
  for (const c of chunks) {
    visible += sanitizer.push(c);
  }
  visible += sanitizer.flush();

  assert.equal(visible, "Direct answer text");
  assert.ok(!visible.includes("</think>"));
});

test("StreamSanitizer — multiple <think> blocks in single stream", () => {
  const sanitizer = new StreamSanitizer();
  const chunks = [
    "Intro text. ",
    "<think>First thought</think>",
    "Middle text. ",
    "<think>Second thought</think>",
    "Conclusion."
  ];

  let visible = "";
  for (const c of chunks) {
    visible += sanitizer.push(c);
  }
  visible += sanitizer.flush();

  assert.equal(visible, "Intro text. Middle text. Conclusion.");
  assert.ok(!visible.includes("First thought"));
  assert.ok(!visible.includes("Second thought"));
});

test("StreamSanitizer — false start marker does not hide user text", () => {
  const sanitizer = new StreamSanitizer();
  const chunks = ["I like to <th", "ink about AI agents and reasoning"];
  
  let visible = "";
  for (const c of chunks) {
    visible += sanitizer.push(c);
  }
  visible += sanitizer.flush();

  assert.equal(visible, "I like to <think about AI agents and reasoning");
});

test("StreamSanitizer — empty model response / thinking only", () => {
  const sanitizer = new StreamSanitizer();
  const chunks = ["<think>Only thinking occurred and nothing was answered.</think>"];
  
  let visible = "";
  for (const c of chunks) {
    visible += sanitizer.push(c);
  }
  visible += sanitizer.flush();

  assert.equal(visible, "");
  assert.equal(sanitizer.getVisibleText(), "");
  assert.ok(sanitizer.getHiddenReasoning().includes("Only thinking"));
});

test("StreamSanitizer — sanitizeFullText static helper", () => {
  const raw = "<think>Hidden</think>Clean subject line";
  const clean = StreamSanitizer.sanitizeFullText(raw);
  assert.equal(clean, "Clean subject line");
});
