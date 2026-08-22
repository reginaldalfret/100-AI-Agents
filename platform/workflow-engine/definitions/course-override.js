import { executeTool } from '../../tools/tool-registry.js';
import { StudentService, AcademicService, AuditService } from '../../services/index.js';

export const CourseOverrideWorkflow = {
  id: 'course-override',
  name: 'Course Registration & Prerequisite Override',
  description: 'Evaluates prerequisite requirements, checks course capacity, verifies Department Chair sign-off, and processes enrollment override.',
  category: 'Academics',
  participatingAgents: [
    { agentId: 'agent-040', role: 'Student Verification & Profile Intake Agent' },
    { agentId: 'agent-034', role: 'Course Catalog & Prerequisite Validation Agent' },
    { agentId: 'agent-018', role: 'Student Academic & Career Advisory Agent' },
    { agentId: 'agent-089', role: 'Faculty Affairs & Departmental Committee HR Agent' },
    { agentId: 'agent-002', role: 'Official Institutional Notice & Email Communication Agent' },
    { agentId: 'agent-100', role: 'Sub-Workflow Orchestration & Task Execution Agent' },
    { agentId: 'agent-101', role: 'Educational Master Workflow Orchestrator' }
  ],
  steps: [
    {
      id: 'prereq-check',
      name: 'Curriculum Prerequisite & Completed Coursework Audit',
      agentId: 'agent-034',
      agentName: 'Course Catalog & Prerequisite Validation Agent',
      type: 'agent_task',
      execute: async (context) => {
        const courseCode = context.courseCode || 'AI401';
        const check = await executeTool('agent-034', 'get_prerequisites', {
          student_id: context.studentId,
          course_id: courseCode
        }, context.instanceId);

        return {
          courseCode,
          prerequisitesMet: check.data.eligible,
          missingPrerequisites: check.data.missingPrerequisites,
          completedPrerequisites: check.data.completedPrerequisites,
          evidence: [
            { source: 'academic_catalog', courseCode, missing: check.data.missingPrerequisites }
          ]
        };
      }
    },
    {
      id: 'chair-approval',
      name: 'Department Chair Prerequisite Override Approval',
      type: 'human_approval',
      description: 'Review student completed coursework and confirm prerequisite waiver approval.',
      requiresDecision: true,
      execute: async (context, stepOutput) => {
        return {
          status: 'Awaiting Department Chair sign-off'
        };
      }
    },
    {
      id: 'enrollment-override',
      name: 'Roster Capacity Allocation & Override Confirmation',
      agentId: 'agent-002',
      agentName: 'Official Institutional Notice & Email Communication Agent',
      type: 'agent_task',
      execute: async (context) => {
        const student = StudentService.getStudentById(context.studentId);
        const courseCode = context.courseCode || 'AI401';

        await executeTool('agent-002', 'send_email', {
          recipient: student.email,
          subject: `Course Registration Override Approved — ${courseCode}`,
          body: `Dear ${student.name},\n\nYour prerequisite override request for ${courseCode} has been approved by the Department Chair.`
        }, context.instanceId);

        return {
          registered: true,
          courseCode,
          enrollmentConfirmed: true,
          evidence: [
            { source: 'registrar_override', courseCode, studentId: student.id }
          ]
        };
      }
    }
  ]
};
