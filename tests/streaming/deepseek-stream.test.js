import test from "node:test";
import assert from "node:assert/strict";
import { StreamSanitizer } from "../../platform/models/stream-sanitizer.js";

test("DeepSeekStream — professional email response simulation", () => {
  const sanitizer = new StreamSanitizer();
  
  const deepseekChunks = [
    "<th", "ink>\n",
    "The user wants a professional email requesting project review.\n",
    "Key points: polite tone, clear subject line, project milestones.\n",
    "</th", "ink>\n\n",
    "Subject: Request for Project Review — Q3 Milestones\n\n",
    "Dear Manager,\n\n",
    "I would like to request a brief review of our current project status.\n\n",
    "Best regards,\nEngineer"
  ];

  const visibleTokens = [];
  let fullAccumulated = "";

  for (const chunk of deepseekChunks) {
    const emitted = sanitizer.push(chunk);
    if (emitted) {
      visibleTokens.push(emitted);
      fullAccumulated += emitted;
    }
  }
  fullAccumulated += sanitizer.flush();

  // Assertions
  assert.ok(visibleTokens.length > 0, "Tokens must stream incrementally");
  assert.ok(fullAccumulated.includes("Subject: Request for Project Review"));
  assert.ok(fullAccumulated.includes("Dear Manager,"));
  assert.ok(!fullAccumulated.includes("<think>"));
  assert.ok(!fullAccumulated.includes("</think>"));
  assert.ok(!fullAccumulated.includes("Key points: polite tone"));
});

test("DeepSeekStream — regression test for non-thinking models (e.g. Qwen, Llama, Nemotron)", () => {
  const sanitizer = new StreamSanitizer();
  const qwenChunks = ["function calculateArea(r) {\n", "  return Math.PI * r * r;\n", "}\n"];
  
  let result = "";
  for (const c of qwenChunks) {
    result += sanitizer.push(c);
  }
  result += sanitizer.flush();

  assert.equal(result, "function calculateArea(r) {\n  return Math.PI * r * r;\n}\n");
});
