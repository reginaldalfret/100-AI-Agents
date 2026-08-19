import { executeTool } from '../../tools/tool-registry.js';
import { StudentService, FinanceService, AuditService } from '../../services/index.js';

export const ScholarshipEligibilityWorkflow = {
  id: 'scholarship-eligibility',
  name: 'Merit & Need-Based Scholarship Evaluation',
  description: 'Validates GPA, household income bracket, tuition balance, Dean financial aid committee review, and award disbursement ledgering.',
  category: 'Financial Aid',
  participatingAgents: [
    { agentId: 'agent-040', role: 'Student Verification & Profile Intake Agent' },
    { agentId: 'agent-045', role: 'Institutional PDF & Transcript Processing Agent' },
    { agentId: 'agent-085', role: 'Scholarship & Financial Aid Eligibility Evaluator Agent' },
    { agentId: 'agent-046', role: 'Institutional Fee Invoice & Receipt Verification Agent' },
    { agentId: 'agent-089', role: 'Faculty Affairs & Departmental Committee HR Agent' },
    { agentId: 'agent-002', role: 'Official Institutional Notice & Email Communication Agent' },
    { agentId: 'agent-099', role: 'Multi-Agent Consensus & Evidence Aggregator Agent' },
    { agentId: 'agent-100', role: 'Sub-Workflow Orchestration & Task Execution Agent' },
    { agentId: 'agent-101', role: 'Educational Master Workflow Orchestrator' }
  ],
  steps: [
    {
      id: 'student-profile-check',
      name: 'Enrollment Status & Identity Verification',
      agentId: 'agent-040',
      agentName: 'Student Verification & Profile Intake Agent',
      type: 'agent_task',
      execute: async (context) => {
        const student = await executeTool('agent-040', 'get_student_profile', { student_id: context.studentId }, context.instanceId);
        return {
          studentId: student.data.id,
          name: student.data.name,
          program: student.data.program,
          gpa: student.data.gpa,
          householdIncome: student.data.householdIncome,
          evidence: [
            { source: 'student_database', studentId: student.data.id, status: student.data.status }
          ]
        };
      }
    },
    {
      id: 'eligibility-assessment',
      name: 'Academic Criteria & Financial Threshold Evaluation',
      agentId: 'agent-085',
      agentName: 'Scholarship & Financial Aid Eligibility Evaluator Agent',
      type: 'agent_task',
      execute: async (context) => {
        const scholarshipId = context.scholarshipId || context.schemeId || 'SCH-MERIT';
        const evaluation = await executeTool('agent-085', 'check_financial_eligibility', {
          student_id: context.studentId,
          scholarship_id: scholarshipId
        }, context.instanceId);

        return {
          evaluation: evaluation.data,
          eligible: evaluation.data.eligible,
          scholarshipName: evaluation.data.scholarshipName,
          awardAmount: evaluation.data.awardAmount,
          evidence: [
            { source: 'finance_service', rule: 'GPA >= 3.5 & Income <= $50,000', met: evaluation.data.eligible }
          ]
        };
      }
    },
    {
      id: 'committee-approval',
      name: 'Financial Aid Review Board & Dean Sign-Off',
      type: 'human_approval',
      description: 'Approve disbursement of scholarship grant based on verified eligibility metrics.',
      requiresDecision: true,
      execute: async (context, stepOutput) => {
        return {
          reviewStatus: 'Ready for committee approval'
        };
      }
    },
    {
      id: 'disbursement-and-notification',
      name: 'Fee Ledger Credit & Student Award Notification',
      agentId: 'agent-046',
      agentName: 'Institutional Fee Invoice & Receipt Verification Agent',
      type: 'agent_task',
      execute: async (context) => {
        const scholarshipId = context.scholarshipId || context.schemeId || 'SCH-MERIT';
        const scholarship = FinanceService.getScholarship(scholarshipId);
        const feeStatus = FinanceService.applyScholarshipAward(context.studentId, scholarship.awardAmount);
        const student = StudentService.getStudentById(context.studentId);

        await executeTool('agent-002', 'send_email', {
          recipient: student.email,
          subject: `Scholarship Award Credited — ${scholarship.name}`,
          body: `Dear ${student.name},\n\nYour scholarship award of $${scholarship.awardAmount.toLocaleString()} has been applied to your tuition ledger.`
        }, context.instanceId);

        return {
          awardAmount: scholarship.awardAmount,
          credited: true,
          updatedFeeStatus: feeStatus,
          evidence: [
            { source: 'ledger_service', creditedAmount: scholarship.awardAmount, newBalance: feeStatus.outstandingBalance }
          ]
        };
      }
    }
  ]
};
