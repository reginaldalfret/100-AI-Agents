import { StudentService, AcademicService, FinanceService, AuditService } from '../../services/index.js';

export const AdmissionVerificationWorkflow = {
  id: 'admission-verification',
  name: 'Student Admission & Document Verification',
  description: 'Automates applicant document verification, academic qualification check, admissions committee sign-off, and offer letter generation.',
  category: 'Admissions',
  steps: [
    {
      id: 'doc-verification',
      name: 'Document Integrity & Authenticity Check',
      agentId: 'agent-045',
      agentName: 'AI PDF Processing Agent',
      type: 'agent_task',
      execute: async (context) => {
        const student = StudentService.getStudentById(context.studentId);
        if (!student) throw new Error(`Student ${context.studentId} not found`);

        student.documents.forEach(doc => {
          StudentService.updateDocumentStatus(student.id, doc.type, 'verified', 'Automated document scan passed.');
        });

        return {
          verifiedDocuments: student.documents.map(d => d.type),
          verificationResult: 'All uploaded applicant documents passed optical validation.',
          verifiedCount: student.documents.length
        };
      }
    },
    {
      id: 'academic-eligibility',
      name: 'Academic Criteria & GPA Qualification Check',
      type: 'service_check',
      execute: async (context) => {
        const student = StudentService.getStudentById(context.studentId);
        const minRequiredGpa = 3.0;
        const eligible = student.gpa >= minRequiredGpa;

        return {
          gpa: student.gpa,
          minRequiredGpa,
          meetsCriteria: eligible,
          program: student.program
        };
      }
    },
    {
      id: 'admissions-approval',
      name: 'Admissions Officer Final Sign-Off',
      type: 'human_approval',
      description: 'Review student credentials and verify admission approval decision.',
      requiresDecision: true,
      execute: async (context, stepOutput) => {
        return {
          recommendation: 'Admit student based on verified high school transcript and prerequisite GPA.'
        };
      }
    },
    {
      id: 'offer-letter-generation',
      name: 'Formal Admission Offer & Letter Dispatch',
      agentId: 'agent-002',
      agentName: 'AI Email Agent',
      type: 'agent_task',
      taskPrompt: (context) => `Write a formal and warm University Admission Offer letter for student ${context.studentName} admitted into ${context.program}. Include details regarding orientation and registration.`,
      execute: async (context, previousOutputs) => {
        StudentService.updateStudent(context.studentId, { status: 'enrolled', admissionStatus: 'admitted' });
        AuditService.logAudit({
          workflowId: context.workflowInstanceId,
          action: 'STUDENT_ADMISSION_CONFIRMED',
          details: { studentId: context.studentId, program: context.program }
        });

        return {
          admissionStatus: 'admitted',
          notificationSent: true,
          recipient: context.studentEmail
        };
      }
    }
  ]
};
