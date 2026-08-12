import assert from "node:assert/strict";
import { agentInfo, runAgent } from "../backend/src/agent.js";

const info = agentInfo();

assert.equal(typeof info.agent_id, "string");
assert.equal(typeof info.agent_name, "string");
assert.equal(typeof info.model, "string");
assert.equal(typeof info.backend, "string");

await assert.rejects(
  () => runAgent({ task: "" }),
  /task is required/
);

assert.doesNotThrow(() => JSON.stringify({ ok: true }));

console.log("Agent contract tests passed.");
