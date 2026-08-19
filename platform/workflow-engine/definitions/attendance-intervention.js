import { executeTool } from '../../tools/tool-registry.js';
import { StudentService, AcademicService, AuditService } from '../../services/index.js';

export const AttendanceInterventionWorkflow = {
  id: 'attendance-intervention',
  name: 'Academic Attendance Audit & Early Intervention',
  description: 'Audits attendance threshold across registered courses, assesses dropout risk score, generates academic recovery counseling plan, and alerts faculty advisor.',
  category: 'Academics',
  participatingAgents: [
    { agentId: 'agent-040', role: 'Student Verification & Profile Intake Agent' },
    { agentId: 'agent-048', role: 'Institutional Academic & Attendance Analytics Agent' },
    { agentId: 'agent-003', role: 'Curriculum & Academic Study Plan Agent' },
    { agentId: 'agent-089', role: 'Faculty Affairs & Departmental Committee HR Agent' },
    { agentId: 'agent-002', role: 'Official Institutional Notice & Email Communication Agent' },
    { agentId: 'agent-100', role: 'Sub-Workflow Orchestration & Task Execution Agent' },
    { agentId: 'agent-101', role: 'Educational Master Workflow Orchestrator' }
  ],
  steps: [
    {
      id: 'attendance-audit',
      name: 'Attendance Record Query & Risk Scoring',
      agentId: 'agent-048',
      agentName: 'Institutional Academic & Attendance Analytics Agent',
      type: 'agent_task',
      execute: async (context) => {
        const attRes = await executeTool('agent-048', 'get_attendance', { student_id: context.studentId }, context.instanceId);
        const atRisk = attRes.data.percentage < 75.0;

        return {
          overallAttendance: attRes.data.percentage,
          isAtRisk: atRisk,
          riskLevel: attRes.data.percentage < 65 ? 'CRITICAL' : (atRisk ? 'WARNING' : 'NORMAL'),
          courseLogs: attRes.data.logs,
          evidence: [
            { source: 'attendance_system', rate: attRes.data.percentage, threshold: 75.0 }
          ]
        };
      }
    },
    {
      id: 'recovery-plan',
      name: 'Personalized Academic Recovery & Study Schedule Design',
      agentId: 'agent-003',
      agentName: 'Curriculum & Academic Study Plan Agent',
      type: 'agent_task',
      execute: async (context) => {
        const student = StudentService.getStudentById(context.studentId);
        return {
          studentName: student.name,
          recommendation: 'Mandatory tutorial sessions on Tue/Thu 16:00 and weekly attendance reporting.',
          scheduledInterventions: 4,
          evidence: [
            { source: 'academic_recovery_engine', status: 'plan_generated' }
          ]
        };
      }
    },
    {
      id: 'advisor-review',
      name: 'Faculty Advisor Review & Counseling Sign-Off',
      type: 'human_approval',
      description: 'Review attendance deficit and confirm counseling intervention roadmap.',
      requiresDecision: true,
      execute: async (context, stepOutput) => {
        return {
          status: 'Awaiting faculty counselor sign-off'
        };
      }
    },
    {
      id: 'notice-dispatch',
      name: 'Formal Warning Notice & Advisor Email Dispatch',
      agentId: 'agent-002',
      agentName: 'Official Institutional Notice & Email Communication Agent',
      type: 'agent_task',
      execute: async (context) => {
        const student = StudentService.getStudentById(context.studentId);
        await executeTool('agent-002', 'send_email', {
          recipient: student.email,
          subject: 'Academic Attendance Warning & Counseling Notice',
          body: `Dear ${student.name},\n\nYour attendance rate is below the mandatory 75% threshold. Please meet your academic advisor.`
        }, context.instanceId);

        return {
          dispatched: true,
          recipient: student.email,
          caseStatus: 'intervention_active',
          evidence: [
            { source: 'notification_service', recipient: student.email, type: 'academic_warning' }
          ]
        };
      }
    }
  ]
};
