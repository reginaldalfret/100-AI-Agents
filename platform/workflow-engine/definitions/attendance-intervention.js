import { StudentService, AcademicService, AuditService } from '../../services/index.js';

export const AttendanceInterventionWorkflow = {
  id: 'attendance-intervention',
  name: 'Attendance Audit & Academic Warning Intervention',
  description: 'Detects chronically absent students, assesses academic risk, generates customized warning notices, and routes for advisor intervention.',
  category: 'Student Affairs',
  steps: [
    {
      id: 'attendance-audit',
      name: 'Class Attendance & Absenteeism Scan',
      type: 'service_check',
      execute: async (context) => {
        const attendance = AcademicService.getStudentAttendance(context.studentId);
        const student = StudentService.getStudentById(context.studentId);

        return {
          studentName: student.name,
          overallAttendanceRate: attendance.overallRate,
          isAtRisk: attendance.isAtRisk,
          threshold: 75.0,
          deficit: Math.max(0, 75.0 - attendance.overallRate)
        };
      }
    },
    {
      id: 'advisor-review',
      name: 'Academic Advisor Intervention Review',
      type: 'human_approval',
      description: 'Review absenteeism data and confirm dispatch of official Academic Warning.',
      requiresDecision: true,
      execute: async (context) => {
        const audit = context.stepOutputs['attendance-audit'];
        return {
          recommendation: audit.isAtRisk
            ? 'Issue Tier-1 Academic Attendance Warning and schedule mandatory counseling session.'
            : 'Attendance satisfactory. No disciplinary action required.'
        };
      }
    },
    {
      id: 'warning-letter-dispatch',
      name: 'Academic Warning Letter Generation & Dispatch',
      agentId: 'agent-002',
      agentName: 'AI Email Agent',
      type: 'agent_task',
      taskPrompt: (context) => {
        const audit = context.stepOutputs['attendance-audit'];
        return `Write an official Academic Attendance Warning email to student ${context.studentName}. Mention their current attendance rate is ${audit.overallAttendanceRate}% which is below the mandatory 75% threshold, and outline the steps for mandatory advisor counseling.`;
      },
      execute: async (context) => {
        StudentService.updateStudent(context.studentId, { status: 'academic_warning' });
        AuditService.logAudit({
          workflowId: context.workflowInstanceId,
          action: 'ACADEMIC_WARNING_ISSUED',
          details: { studentId: context.studentId }
        });

        return {
          warningIssued: true,
          statusUpdated: 'academic_warning',
          counselingAssigned: true
        };
      }
    }
  ]
};
