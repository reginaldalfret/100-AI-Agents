import test from "node:test";
import assert from "node:assert/strict";

test("Gemma Style v1 — Model Discovery in Local Ollama", async () => {
  const res = await fetch("http://127.0.0.1:11434/api/tags");
  assert.strictEqual(res.status, 200, "Ollama service must respond with HTTP 200");
  const data = await res.json();
  const models = data.models || [];
  
  const gemma = models.find(m => m.name === "gemma3:1b" || m.name.startsWith("gemma3:1b"));
  assert.ok(gemma, "gemma3:1b must be installed in Ollama");
  assert.strictEqual(gemma.details.family, "gemma3", "Family must be gemma3");
  assert.strictEqual(gemma.details.quantization_level, "Q4_K_M", "Quantization must be Q4_K_M");
  assert.ok(gemma.size > 700 * 1024 * 1024, "Model size must be > 700MB");
});
