import test from "node:test";
import assert from "node:assert/strict";

test("Gemma Style v1 — Original Base & Ollama Model Protection", async () => {
  const res = await fetch("http://127.0.0.1:11434/api/tags");
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  const models = data.models || [];
  
  const gemma = models.find(m => m.name.startsWith("gemma3:1b"));
  assert.ok(gemma, "Original gemma3:1b must remain registered in Ollama");
  assert.strictEqual(gemma.details.quantization_level, "Q4_K_M", "Original quantization must remain Q4_K_M");
  assert.strictEqual(gemma.model, "gemma3:1b", "Original model tag must remain untouched");
});
