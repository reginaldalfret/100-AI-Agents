import { StudentService, AcademicService, FinanceService, AuditService } from '../../services/index.js';

export const ScholarshipEligibilityWorkflow = {
  id: 'scholarship-eligibility',
  name: 'Scholarship & Financial Aid Evaluation',
  description: 'Automates multi-factor merit and need-based evaluation, committee sign-off, ledger credit adjustment, and award letter generation.',
  category: 'Financial Aid',
  steps: [
    {
      id: 'academic-attendance-audit',
      name: 'Academic Merit & Attendance Audit',
      type: 'service_check',
      execute: async (context) => {
        const student = StudentService.getStudentById(context.studentId);
        const attendance = AcademicService.getStudentAttendance(context.studentId);

        return {
          gpa: student.gpa,
          attendanceRate: attendance.overallRate,
          studentName: student.name,
          academicStanding: student.gpa >= 3.5 ? 'Distinction' : 'Good'
        };
      }
    },
    {
      id: 'scheme-evaluation',
      name: 'Scholarship Scheme Eligibility Computation',
      type: 'service_check',
      execute: async (context, previousOutputs) => {
        const student = StudentService.getStudentById(context.studentId);
        const schemeId = context.schemeId || 'SCH-MERIT';
        const evaluation = FinanceService.evaluateScholarship(student, schemeId);

        return evaluation;
      }
    },
    {
      id: 'committee-approval',
      name: 'Financial Aid Committee Review & Approval',
      type: 'human_approval',
      description: 'Review calculated award and approve financial aid disbursement.',
      requiresDecision: true,
      execute: async (context, stepOutput) => {
        const schemeEval = context.stepOutputs['scheme-evaluation'];
        return {
          schemeName: schemeEval.schemeName,
          awardAmount: schemeEval.awardAmount,
          recommendation: schemeEval.eligible ? 'Approved for full scholarship disbursement.' : 'Conditional review needed.'
        };
      }
    },
    {
      id: 'disbursement-and-notification',
      name: 'Ledger Credit & Award Notification',
      agentId: 'agent-002',
      agentName: 'AI Email Agent',
      type: 'agent_task',
      taskPrompt: (context) => {
        const schemeEval = context.stepOutputs['scheme-evaluation'];
        return `Write an official Scholarship Award Notification email to student ${context.studentName} for the ${schemeEval.schemeName} in the amount of $${schemeEval.awardAmount}.`;
      },
      execute: async (context) => {
        const schemeEval = context.stepOutputs['scheme-evaluation'];
        const updatedFinancials = FinanceService.applyScholarshipAward(
          context.studentId,
          schemeEval.awardAmount,
          schemeEval.schemeName
        );

        AuditService.logAudit({
          workflowId: context.workflowInstanceId,
          action: 'SCHOLARSHIP_DISBURSED',
          details: {
            studentId: context.studentId,
            scheme: schemeEval.schemeName,
            amount: schemeEval.awardAmount,
            newBalance: updatedFinancials.outstandingBalance
          }
        });

        return {
          awardAmount: schemeEval.awardAmount,
          schemeName: schemeEval.schemeName,
          remainingTuitionBalance: updatedFinancials.outstandingBalance,
          notificationDispatched: true
        };
      }
    }
  ]
};
