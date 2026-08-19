import assert from 'node:assert/strict';
import { test } from 'node:test';
import { StudentService, AcademicService, FinanceService, AuditService } from '../platform/services/index.js';

test('StudentService: retrieve, update, and manage documents', () => {
  const students = StudentService.getAllStudents();
  assert.ok(students.length >= 5);

  const student = StudentService.getStudentById('STU-1001');
  assert.equal(student.name, 'Aarav Sharma');
  assert.equal(typeof student.gpa, 'number');

  const updated = StudentService.updateStudent('STU-1001', { gpa: 3.88 });
  assert.equal(updated.gpa, 3.88);

  const doc = StudentService.updateDocumentStatus('STU-1001', 'id_proof', 'verified', 'Passed manual check');
  assert.equal(doc.status, 'verified');
});

test('AcademicService: course catalog, prerequisites, and attendance', () => {
  const courses = AcademicService.getAllCourses();
  assert.ok(courses.length >= 4);

  const check1 = AcademicService.checkPrerequisites('STU-1001', 'CS301');
  assert.equal(check1.eligible, true);

  const check2 = AcademicService.checkPrerequisites('STU-1003', 'CS301');
  assert.equal(check2.eligible, false);
  assert.ok(check2.missingPrerequisites.includes('CS201'));

  const attendance = AcademicService.getStudentAttendance('STU-1003');
  assert.equal(attendance.isAtRisk, true);
});

test('FinanceService: scholarships, fee balances, and award ledgering', () => {
  const schemes = FinanceService.getAllScholarshipSchemes();
  assert.ok(schemes.length >= 3);

  const student1 = StudentService.getStudentById('STU-1001');
  const evalMerit = FinanceService.evaluateScholarship(student1, 'SCH-MERIT');
  assert.equal(evalMerit.eligible, true);

  const student3 = StudentService.getStudentById('STU-1003');
  const evalFail = FinanceService.evaluateScholarship(student3, 'SCH-MERIT');
  assert.equal(evalFail.eligible, false);

  const initialFin = FinanceService.getStudentFinancials('STU-1002');
  const initialBalance = initialFin.outstandingBalance;
  const updatedFin = FinanceService.applyScholarshipAward('STU-1002', 6000, 'Presidential Merit Scholarship');
  assert.equal(updatedFin.outstandingBalance, initialBalance - 6000);
});

test('AuditService: structured audit trail logging and retrieval', () => {
  const entry = AuditService.logAudit({
    workflowId: 'TEST-WF-001',
    action: 'TEST_ACTION',
    actor: 'UnitTest',
    details: { key: 'value' }
  });
  assert.ok(entry.id.startsWith('AUD-'));

  const logs = AuditService.getAuditLogs({ workflowId: 'TEST-WF-001' });
  assert.ok(logs.length >= 1);
  assert.equal(logs[0].action, 'TEST_ACTION');
});
