import assert from 'node:assert/strict';
import { test } from 'node:test';
import { WorkflowEngine } from '../platform/workflow-engine/index.js';

test('WorkflowEngine: list definitions and start admission workflow to pending approval', async () => {
  const definitions = WorkflowEngine.getAvailableWorkflows();
  assert.ok(definitions.length >= 5);

  const instance = await WorkflowEngine.startWorkflow('admission-verification', {
    studentId: 'STU-1005'
  });

  assert.ok(instance.id.startsWith('WF-'));
  assert.equal(instance.status, 'pending_approval');
  assert.ok(instance.pendingDecision);
  assert.equal(instance.pendingDecision.stepId, 'admissions-approval');
});

test('WorkflowEngine: human-in-the-loop decision approval advances workflow to completion', async () => {
  const instance = await WorkflowEngine.startWorkflow('scholarship-eligibility', {
    studentId: 'STU-1001',
    schemeId: 'SCH-MERIT'
  });

  assert.equal(instance.status, 'pending_approval');
  assert.equal(instance.pendingDecision.stepId, 'committee-approval');

  const updated = await WorkflowEngine.submitDecision(instance.id, 'approved', 'Approved by Financial Aid Dean');
  assert.equal(updated.status, 'completed');
  assert.ok(updated.result);
  assert.ok(updated.context.stepOutputs['disbursement-and-notification']);
});

test('WorkflowEngine: human-in-the-loop rejection halts workflow cleanly', async () => {
  const instance = await WorkflowEngine.startWorkflow('course-override', {
    studentId: 'STU-1003',
    courseCode: 'CS301'
  });

  assert.equal(instance.status, 'pending_approval');
  const rejectedInstance = await WorkflowEngine.submitDecision(instance.id, 'rejected', 'Prerequisite waiver denied due to insufficient GPA.');
  assert.equal(rejectedInstance.status, 'rejected');
  assert.equal(rejectedInstance.stepHistory[rejectedInstance.stepHistory.length - 1].status, 'rejected');
});
