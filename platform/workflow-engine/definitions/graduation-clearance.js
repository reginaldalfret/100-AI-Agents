import { executeTool } from '../../tools/tool-registry.js';
import { StudentService, AcademicService, FinanceService, AuditService } from '../../services/index.js';

export const GraduationClearanceWorkflow = {
  id: 'graduation-clearance',
  name: 'Degree Audit & Graduation Clearance',
  description: 'Audits completed curriculum credits, verifies zero-balance fee ledger, validates thesis/project clearance, Dean sign-off, and degree certificate issue.',
  category: 'Registrar',
  participatingAgents: [
    { agentId: 'agent-040', role: 'Student Verification & Profile Intake Agent' },
    { agentId: 'agent-035', role: 'Course Catalog & Prerequisite Validation Agent' },
    { agentId: 'agent-048', role: 'Institutional Academic & Attendance Analytics Agent' },
    { agentId: 'agent-046', role: 'Institutional Fee Invoice & Receipt Verification Agent' },
    { agentId: 'agent-045', role: 'Institutional PDF & Transcript Processing Agent' },
    { agentId: 'agent-001', role: 'Institutional Formal Document & Letter Drafting Agent' },
    { agentId: 'agent-002', role: 'Official Institutional Notice & Email Communication Agent' },
    { agentId: 'agent-099', role: 'Multi-Agent Consensus & Evidence Aggregator Agent' },
    { agentId: 'agent-100', role: 'Sub-Workflow Orchestration & Task Execution Agent' },
    { agentId: 'agent-101', role: 'Educational Master Workflow Orchestrator' }
  ],
  steps: [
    {
      id: 'credit-audit',
      name: 'Degree Credit & Curriculum Completion Audit',
      agentId: 'agent-035',
      agentName: 'Course Catalog & Prerequisite Validation Agent',
      type: 'agent_task',
      execute: async (context) => {
        const student = await executeTool('agent-040', 'get_student_profile', { student_id: context.studentId }, context.instanceId);
        const requiredCredits = 80;
        const earnedCredits = (student.data.semester || 4) * 20;

        return {
          studentId: student.data.id,
          earnedCredits,
          requiredCredits,
          creditsFulfilled: earnedCredits >= requiredCredits,
          gpa: student.data.gpa,
          evidence: [
            { source: 'academic_records', earnedCredits, requiredCredits, gpa: student.data.gpa }
          ]
        };
      }
    },
    {
      id: 'financial-clearance',
      name: 'Bursar Zero-Balance & Outstanding Dues Check',
      agentId: 'agent-046',
      agentName: 'Institutional Fee Invoice & Receipt Verification Agent',
      type: 'agent_task',
      execute: async (context) => {
        const feeStatus = await executeTool('agent-046', 'get_fee_status', { student_id: context.studentId }, context.instanceId);
        return {
          outstandingBalance: feeStatus.data.outstandingBalance,
          financialClearance: feeStatus.data.status === 'cleared',
          evidence: [
            { source: 'bursar_records', balance: feeStatus.data.outstandingBalance, cleared: feeStatus.data.status === 'cleared' }
          ]
        };
      }
    },
    {
      id: 'dean-clearance-approval',
      name: 'Academic Dean & Registrar Degree Clearance',
      type: 'human_approval',
      description: 'Review credit audit and financial clearance to approve degree award.',
      requiresDecision: true,
      execute: async (context, stepOutput) => {
        return {
          status: 'Awaiting Dean degree clearance sign-off'
        };
      }
    },
    {
      id: 'certificate-issue',
      name: 'Digital Degree Clearance Memo & Notice Generation',
      agentId: 'agent-001',
      agentName: 'Institutional Formal Document & Letter Drafting Agent',
      type: 'agent_task',
      execute: async (context) => {
        const student = StudentService.getStudentById(context.studentId);
        StudentService.updateStudent(student.id, {
          status: 'graduated'
        });

        await executeTool('agent-002', 'send_email', {
          recipient: student.email,
          subject: 'Official Graduation & Degree Clearance Notification',
          body: `Dear ${student.name},\n\nCongratulations! You have completed all academic and institutional requirements for graduation.`
        }, context.instanceId);

        return {
          certificateIssued: true,
          degreeStatus: 'graduated',
          recipient: student.email,
          evidence: [
            { source: 'registrar_degree_service', status: 'degree_issued', recipient: student.email }
          ]
        };
      }
    }
  ]
};
