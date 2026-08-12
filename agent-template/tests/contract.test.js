import assert from "node:assert/strict";
import { agentInfo, runAgent } from "../backend/src/agent.js";

assert.equal(typeof agentInfo().agent_id, "string");
assert.equal(typeof agentInfo().agent_name, "string");

await assert.rejects(
  () => runAgent({ task: "" }),
  /task is required/
);

assert.throws(
  () => JSON.stringify({ ok: true }),
  () => false,
  "JSON runtime sanity check"
);

console.log("Agent contract tests passed.");
