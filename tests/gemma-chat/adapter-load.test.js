import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PersonalStyleGemmaRuntime } from "../../platform/personal-style/gemma-runtime.js";

test("Gemma Chat — Adapter Path and Inspection", async () => {
  const runtime = new PersonalStyleGemmaRuntime();
  assert.ok(runtime.adapterPath.includes("gemma-kaviya-style-v1"));
  assert.ok(fs.existsSync(runtime.adapterPath), "Adapter path must exist");
  const loaded = await runtime.load_adapter();
  assert.equal(typeof loaded, "boolean");
  const health = runtime.health();
  assert.equal(health.adapter_loaded, loaded);
});
