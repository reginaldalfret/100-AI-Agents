import test from 'node:test';
import assert from 'node:assert/strict';

import { TOOL_DEFINITIONS, executeTool, isToolAllowed } from '../platform/tools/tool-registry.js';
import * as AuditService from '../platform/services/audit-service.js';

test('Tool Registry: definitions contain all required domains', () => {
  assert.ok(TOOL_DEFINITIONS.get_student_profile, 'get_student_profile exists');
  assert.ok(TOOL_DEFINITIONS.get_attendance, 'get_attendance exists');
  assert.ok(TOOL_DEFINITIONS.get_fee_status, 'get_fee_status exists');
  assert.ok(TOOL_DEFINITIONS.get_document, 'get_document exists');
  assert.ok(TOOL_DEFINITIONS.calculate_merit, 'calculate_merit exists');
  assert.ok(TOOL_DEFINITIONS.create_approval, 'create_approval exists');
  assert.ok(TOOL_DEFINITIONS.send_email, 'send_email exists');
});

test('Tool Permissions: enforces RBAC allowlists per agent', () => {
  // Agent 040 (Student Verification Agent) is allowed get_student_profile
  assert.equal(isToolAllowed('agent-040', 'get_student_profile'), true);

  // Agent 002 (AI Email Agent) is NOT allowed calculate_merit
  assert.equal(isToolAllowed('agent-002', 'calculate_merit'), false);

  // Agent 101 (Master Orchestrator) is allowed all tools
  assert.equal(isToolAllowed('agent-101', 'calculate_merit'), true);
  assert.equal(isToolAllowed('agent-101', 'get_student_profile'), true);
});

test('Tool Execution: executes student and academic tools cleanly', async () => {
  const profileRes = await executeTool('agent-040', 'get_student_profile', { student_id: 'STU-1001' }, 'WF-TEST-01');
  assert.equal(profileRes.status, 'success');
  assert.equal(profileRes.data.id, 'STU-1001');
  assert.equal(profileRes.data.name, 'Aarav Sharma');

  const attRes = await executeTool('agent-048', 'get_attendance', { student_id: 'STU-1001' }, 'WF-TEST-01');
  assert.equal(attRes.status, 'success');
  assert.equal(attRes.data.percentage, 96.4);
});

test('Tool Execution: rejects unauthorized tool call with Permission Denied error', async () => {
  await assert.rejects(
    async () => {
      await executeTool('agent-002', 'calculate_merit', { application_id: 'ADM-2026-001' }, 'WF-TEST-02');
    },
    /Permission Denied/
  );
});

test('Tool Execution: document intelligence & admission merit calculation', async () => {
  const meritRes = await executeTool('agent-077', 'calculate_merit', { application_id: 'ADM-2026-001' }, 'WF-TEST-03');
  assert.equal(meritRes.status, 'success');
  assert.ok(meritRes.data.calculatedMeritScore > 0);
  assert.equal(meritRes.data.eligibleForSeatAllocation, true);

  const docRes = await executeTool('agent-045', 'extract_document_data', { document_id: 'DOC-8001' }, 'WF-TEST-03');
  assert.equal(docRes.status, 'success');
  assert.equal(docRes.data.extractedData.mathScore, 95);
});

test('Tool Execution: records audit entries for all tool calls', async () => {
  const audits = AuditService.getAuditTrail('WF-TEST-01');
  assert.ok(audits.length >= 2, 'Audit trail contains logged actions');
  assert.ok(audits.some(a => a.agentId === 'agent-040'));
});
