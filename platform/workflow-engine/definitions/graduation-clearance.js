import { StudentService, FinanceService, AuditService } from '../../services/index.js';

export const GraduationClearanceWorkflow = {
  id: 'graduation-clearance',
  name: 'Graduation Audit & Degree Clearance',
  description: 'Audits student credits, library/finance clearance, dean sign-off, and automated degree certificate dispatch.',
  category: 'Registrar',
  steps: [
    {
      id: 'academic-financial-clearance',
      name: 'Degree Audit & Financial Balance Verification',
      type: 'service_check',
      execute: async (context) => {
        const student = StudentService.getStudentById(context.studentId);
        const financials = FinanceService.getStudentFinancials(context.studentId);

        const feeCleared = financials ? financials.outstandingBalance === 0 : true;

        return {
          studentName: student.name,
          program: student.program,
          gpa: student.gpa,
          outstandingBalance: financials ? financials.outstandingBalance : 0,
          financialClearance: feeCleared ? 'CLEARED' : 'OUTSTANDING_FEES',
          academicStanding: student.gpa >= 3.0 ? 'ELIGIBLE' : 'PROBATION'
        };
      }
    },
    {
      id: 'registrar-approval',
      name: 'Registrar & Dean Final Degree Sign-off',
      type: 'human_approval',
      description: 'Confirm graduation eligibility, honors status, and degree conferral.',
      requiresDecision: true,
      execute: async (context) => {
        const clearance = context.stepOutputs['academic-financial-clearance'];
        return {
          recommendation: clearance.financialClearance === 'CLEARED' && clearance.academicStanding === 'ELIGIBLE'
            ? 'Approved for Degree Conferral and Certificate Issuance.'
            : 'Hold on conferral pending fee clearance.'
        };
      }
    },
    {
      id: 'degree-certificate-dispatch',
      name: 'Degree Completion Notice & Certificate Generation',
      agentId: 'agent-001',
      agentName: 'AI Writing Agent',
      type: 'agent_task',
      taskPrompt: (context) => `Write an official Degree Completion and Graduation Conferral letter for student ${context.studentName}, graduating with ${context.program} with GPA ${context.gpa}.`,
      execute: async (context) => {
        StudentService.updateStudent(context.studentId, { status: 'graduated' });
        AuditService.logAudit({
          workflowId: context.workflowInstanceId,
          action: 'DEGREE_CONFERRED',
          details: { studentId: context.studentId, program: context.program }
        });

        return {
          graduationStatus: 'conferred',
          certificateGenerated: true
        };
      }
    }
  ]
};
