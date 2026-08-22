import { executeInCodeSandbox } from "../../platform/sandbox/index.js";
import { runTestSuite } from "./harness.js";
import assert from "node:assert";

await runTestSuite("Secure Code Sandbox Tests", [
  {
    name: "Executes Safe Python script in sandbox",
    fn: async () => {
      const res = await executeInCodeSandbox("t_init = 10.0\nt_meas = 5.9\nloss = t_init - t_meas\nprint(f'LOSS:{loss:.2f}')", "python");
      assert.strictEqual(res.success, true);
      assert.ok(res.stdout.includes("LOSS:4.10"));
    }
  },
  {
    name: "Blocks Unauthorized System Access (os.system)",
    fn: async () => {
      const res = await executeInCodeSandbox("import os\nos.system('dir')", "python");
      assert.strictEqual(res.success, false);
      assert.ok(res.error.includes("SANDBOX_SECURITY_VIOLATION"));
    }
  },
  {
    name: "Blocks Unauthorized Network Fetch in sandbox",
    fn: async () => {
      const res = await executeInCodeSandbox("fetch('https://api.openai.com')", "js");
      assert.strictEqual(res.success, false);
      assert.ok(res.error.includes("SANDBOX_SECURITY_VIOLATION"));
    }
  }
]);
