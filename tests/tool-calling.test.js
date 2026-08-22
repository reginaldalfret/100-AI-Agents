import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { callToolStructured } from "../platform/intelligence/index.js";

describe("Nemotron Intelligence V1 — Structured Tool Calling & RBAC Tests", () => {
  test("1. Successfully executes authorized tool for academic standing", async () => {
    const res = await callToolStructured({
      agent_id: "agent-006",
      tool_name: "get_attendance",
      arguments: { student_id: "STU-1001" }
    });
    assert.equal(res.success, true);
    assert.equal(res.tool_name, "get_attendance");
    assert.ok(res.evidence);
    assert.ok(res.result.percentage !== undefined || res.result.overallRate !== undefined);
  });

  test("2. Rejects unauthorized tool execution with PERMISSION_DENIED", async () => {
    // Agent 081 (Social Media) trying to modify or evaluate financial scholarship eligibility
    const res = await callToolStructured({
      agent_id: "agent-081",
      tool_name: "check_financial_eligibility",
      arguments: { student_id: "STU-1001" }
    });
    assert.equal(res.success, false);
    assert.equal(res.error_code, "PERMISSION_DENIED");
  });

  test("3. Handles non-existent tool gracefully without crash", async () => {
    const res = await callToolStructured({
      agent_id: "agent-101",
      tool_name: "non_existent_fake_tool",
      arguments: {}
    });
    assert.equal(res.success, false);
    assert.equal(res.error_code, "TOOL_NOT_FOUND");
  });

  test("4. Attaches verified evidence metadata to successful executions", async () => {
    const res = await callToolStructured({
      agent_id: "agent-045",
      tool_name: "get_document",
      arguments: { document_id: "DOC-8002" }
    });
    assert.equal(res.success, true);
    assert.ok(res.evidence);
    assert.equal(res.evidence.verified, true);
    assert.ok(res.result.documentType);
  });
});
