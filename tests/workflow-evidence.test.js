import test from 'node:test';
import assert from 'node:assert/strict';

import { WorkflowEngine } from '../platform/workflow-engine/index.js';
import * as AuditService from '../platform/services/audit-service.js';

test('Workflow 1 — Admission & Document Verification with Evidence', async () => {
  const instance = await WorkflowEngine.startWorkflow('admission-verification', {
    studentId: 'STU-1005'
  });

  assert.equal(instance.status, 'pending_approval');
  assert.ok(instance.stepHistory.some(s => s.agentId === 'agent-040'));
  assert.ok(instance.stepHistory.some(s => s.agentId === 'agent-045'));
  assert.ok(instance.stepHistory.some(s => s.agentId === 'agent-077'));

  const approved = await WorkflowEngine.submitDecision(instance.id, 'approved', 'Admissions board confirmed merit seat.');
  assert.equal(approved.status, 'completed');
  assert.equal(approved.context.stepOutputs['offer-letter-generation'].enrollmentStatus, 'enrolled');

  const audit = AuditService.getAuditTrail(instance.id);
  assert.ok(audit.length >= 3, 'Audit entries recorded throughout admission pipeline');
});

test('Workflow 2 — Scholarship Eligibility & Fee Disbursement with Evidence', async () => {
  const instance = await WorkflowEngine.startWorkflow('scholarship-eligibility', {
    studentId: 'STU-1002',
    scholarshipId: 'SCH-NEED'
  });

  assert.equal(instance.status, 'pending_approval');
  const approved = await WorkflowEngine.submitDecision(instance.id, 'approved', 'Approved by Financial Aid Committee');
  assert.equal(approved.status, 'completed');
  assert.ok(approved.context.stepOutputs['disbursement-and-notification'].credited);
});

test('Workflow 3 — Attendance Audit & Early Warning Intervention with Evidence', async () => {
  const instance = await WorkflowEngine.startWorkflow('attendance-intervention', {
    studentId: 'STU-1003'
  });

  assert.equal(instance.status, 'pending_approval');
  const approved = await WorkflowEngine.submitDecision(instance.id, 'approved', 'Advisor counseling roadmap confirmed');
  assert.equal(approved.status, 'completed');
  assert.equal(approved.context.stepOutputs['notice-dispatch'].caseStatus, 'intervention_active');
});

test('Workflow 4 — Course Registration & Prerequisite Override with Evidence', async () => {
  const instance = await WorkflowEngine.startWorkflow('course-override', {
    studentId: 'STU-1001',
    courseCode: 'CS301'
  });

  assert.equal(instance.status, 'pending_approval');
  const approved = await WorkflowEngine.submitDecision(instance.id, 'approved', 'Chair waiver approved based on research project');
  assert.equal(approved.status, 'completed');
  assert.ok(approved.context.stepOutputs['enrollment-override'].registered);
});

test('Workflow 5 — Degree Audit & Graduation Clearance with Evidence', async () => {
  const instance = await WorkflowEngine.startWorkflow('graduation-clearance', {
    studentId: 'STU-1004'
  });

  assert.equal(instance.status, 'pending_approval');
  const approved = await WorkflowEngine.submitDecision(instance.id, 'approved', 'Dean cleared student for degree conferral');
  assert.equal(approved.status, 'completed');
  assert.equal(approved.context.stepOutputs['certificate-issue'].degreeStatus, 'graduated');
});
