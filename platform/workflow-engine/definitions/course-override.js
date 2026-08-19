import { StudentService, AcademicService, AuditService } from '../../services/index.js';

export const CourseOverrideWorkflow = {
  id: 'course-override',
  name: 'Course Registration & Prerequisite Override',
  description: 'Audits course capacity and prerequisites, evaluates justification, routes for department chair sign-off, and enrolls student upon approval.',
  category: 'Academics',
  steps: [
    {
      id: 'prerequisite-audit',
      name: 'Course Prerequisite & Capacity Evaluation',
      type: 'service_check',
      execute: async (context) => {
        const course = AcademicService.getCourse(context.courseCode);
        const check = AcademicService.checkPrerequisites(context.studentId, context.courseCode);
        const student = StudentService.getStudentById(context.studentId);

        return {
          courseCode: context.courseCode,
          courseTitle: course ? course.title : '',
          studentName: student.name,
          prerequisitesMet: check.eligible,
          missingPrerequisites: check.missingPrerequisites,
          currentCapacity: course ? `${course.enrolled}/${course.capacity}` : 'N/A'
        };
      }
    },
    {
      id: 'dean-chair-approval',
      name: 'Department Chair / Dean Override Review',
      type: 'human_approval',
      description: 'Review student prerequisite standing and approve special registration override.',
      requiresDecision: true,
      execute: async (context) => {
        const prereq = context.stepOutputs['prerequisite-audit'];
        return {
          recommendation: prereq.prerequisitesMet
            ? 'Standard enrollment approved.'
            : `Special academic waiver recommended for missing prerequisite: ${prereq.missingPrerequisites.join(', ')}.`
        };
      }
    },
    {
      id: 'enrollment-confirmation',
      name: 'Course Registration Confirmation Dispatch',
      agentId: 'agent-002',
      agentName: 'AI Email Agent',
      type: 'agent_task',
      taskPrompt: (context) => `Write an official Course Registration Confirmation email to student ${context.studentName} confirming successful registration into course ${context.courseCode}.`,
      execute: async (context) => {
        AuditService.logAudit({
          workflowId: context.workflowInstanceId,
          action: 'COURSE_OVERRIDE_APPROVED',
          details: { studentId: context.studentId, courseCode: context.courseCode }
        });

        return {
          enrolledCourse: context.courseCode,
          registrationStatus: 'confirmed'
        };
      }
    }
  ]
};
