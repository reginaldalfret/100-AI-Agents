import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { parseIntent, routeRequest, IntentDomains } from "../platform/intelligence/index.js";

describe("Nemotron Intelligence V1 — Routing & Intent Tests", () => {
  test("1. Direct attendance query routes to Academic Specialist (agent-006)", () => {
    const res = routeRequest("Check student STU-1001's attendance.");
    assert.equal(res.mode, "single_agent");
    assert.equal(res.primary_agent, "agent-006");
    assert.equal(res.intent.entities.student_id, "STU-1001");
  });

  test("2. Natural language phrasing routes to Academic Specialist (agent-006)", () => {
    const res = routeRequest("Can you tell me how often STU-1001 has been attending classes?");
    assert.equal(res.mode, "single_agent");
    assert.equal(res.primary_agent, "agent-006");
    assert.equal(res.intent.entities.student_id, "STU-1001");
  });

  test("3. Social media query routes to Social Media Specialist (agent-081)", () => {
    const res = routeRequest("Research about the Instagram account @reginaldalfret");
    assert.equal(res.mode, "single_agent");
    assert.equal(res.primary_agent, "agent-081");
    assert.equal(res.intent.entities.handle, "@reginaldalfret");
    assert.equal(res.intent.entities.platform, "instagram");
  });

  test("4. Document income verification routes to Document Specialist (agent-045)", () => {
    const res = routeRequest("Verify this student's income certificate.");
    assert.equal(res.mode, "single_agent");
    assert.equal(res.primary_agent, "agent-045");
    assert.equal(res.intent.entities.document_type, "income_certificate");
  });

  test("5. Cross-domain query generates multi-agent DAG plan under Agent 101", () => {
    const res = routeRequest("Check the student's academic record and determine whether they qualify financially for the scholarship.");
    assert.equal(res.mode, "multi_agent_dag");
    assert.equal(res.primary_agent, "agent-101");
    assert.ok(Array.isArray(res.plan?.steps));
    assert.ok(res.plan.steps.length >= 3);
  });

  test("6. High-risk fee modification is flagged with high risk and HITL requirement", () => {
    const intent = parseIntent("Change this student's financial fee record.");
    assert.equal(intent.risk, "high");
    assert.equal(intent.requires_hitl, true);
  });

  test("7. Unrelated trivia query is flagged as unrelated", () => {
    const intent = parseIntent("What is the capital of France?");
    assert.equal(intent.domain, IntentDomains.UNRELATED);
    assert.equal(intent.action, "reject_or_out_of_scope");
  });
});
