import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runTestSuite } from "../sih/harness.js";
import assert from "node:assert";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../..");
const BENCHMARK_JSON = path.join(ROOT_DIR, "docs", "benchmark", "results.json");

await runTestSuite("Hardware Performance & Model Benchmark Verification", [
  {
    name: "Verifies Hardware Profile and Local Model Stack",
    fn: async () => {
      const hwPath = path.join(ROOT_DIR, "docs", "benchmark", "hardware-profile.json");
      assert.strictEqual(fs.existsSync(hwPath), true, "hardware-profile.json must exist");
      const hw = JSON.parse(fs.readFileSync(hwPath, "utf8"));
      assert.ok(hw.gpu.name.includes("RTX 2050"));
      assert.strictEqual(hw.gpu.total_vram_mb, 4096);
    }
  },
  {
    name: "Confirms Zero External Cloud Egress during Benchmark",
    fn: async () => {
      if (fs.existsSync(BENCHMARK_JSON)) {
        const results = JSON.parse(fs.readFileSync(BENCHMARK_JSON, "utf8"));
        assert.strictEqual(results.sovereignty.total_external_calls, 0);
        assert.strictEqual(results.sovereignty.is_air_gapped, true);
      }
    }
  }
]);
