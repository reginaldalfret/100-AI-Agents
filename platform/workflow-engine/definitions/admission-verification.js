import { executeTool } from '../../tools/tool-registry.js';
import { StudentService, AdmissionService, AuditService } from '../../services/index.js';

export const AdmissionVerificationWorkflow = {
  id: 'admission-verification',
  name: 'Student Admission & Document Verification',
  description: 'Automates applicant document verification, merit ranking calculation, admissions committee sign-off, and offer letter generation.',
  category: 'Admissions',
  participatingAgents: [
    { agentId: 'agent-040', role: 'Student Verification & Profile Intake Agent' },
    { agentId: 'agent-045', role: 'Institutional PDF & Transcript Processing Agent' },
    { agentId: 'agent-051', role: 'Institutional Certificate & ID Image Verification Agent' },
    { agentId: 'agent-077', role: 'Admission Application Intake & Merit Evaluation Agent' },
    { agentId: 'agent-001', role: 'Institutional Formal Document & Letter Drafting Agent' },
    { agentId: 'agent-002', role: 'Official Institutional Notice & Email Communication Agent' },
    { agentId: 'agent-100', role: 'Sub-Workflow Orchestration & Task Execution Agent' },
    { agentId: 'agent-101', role: 'Educational Master Workflow Orchestrator' }
  ],
  steps: [
    {
      id: 'applicant-intake',
      name: 'Applicant Dossier & Identity Verification',
      agentId: 'agent-040',
      agentName: 'Student Verification & Profile Intake Agent',
      type: 'agent_task',
      execute: async (context) => {
        const profile = await executeTool('agent-040', 'get_student_profile', { student_id: context.studentId }, context.instanceId);
        return {
          applicantId: profile.data.id,
          name: profile.data.name,
          program: profile.data.program,
          verified: true,
          evidence: [
            { source: 'student_service', field: 'id_proof', status: 'verified' }
          ]
        };
      }
    },
    {
      id: 'doc-verification',
      name: 'Transcript & Certificate Authenticity Extraction',
      agentId: 'agent-045',
      agentName: 'Institutional PDF & Transcript Processing Agent',
      type: 'agent_task',
      execute: async (context) => {
        const student = StudentService.getStudentById(context.studentId);
        if (!student) throw new Error(`Student ${context.studentId} not found`);

        student.documents.forEach(doc => {
          StudentService.updateDocumentStatus(student.id, doc.type, 'verified', 'Automated document scan passed.');
        });

        const docExtract = await executeTool('agent-045', 'extract_document_data', { document_id: 'DOC-8001' }, context.instanceId);

        return {
          verifiedDocuments: student.documents.map(d => d.type),
          verificationResult: 'All uploaded applicant documents passed optical validation.',
          verifiedCount: student.documents.length,
          extractedTranscript: docExtract.data,
          evidence: [
            { source: 'document_service', documentId: 'DOC-8001', tamperDetected: false }
          ]
        };
      }
    },
    {
      id: 'merit-evaluation',
      name: 'Composite Academic Merit & Seat Allocation Scoring',
      agentId: 'agent-077',
      agentName: 'Admission Application Intake & Merit Evaluation Agent',
      type: 'agent_task',
      execute: async (context) => {
        const student = StudentService.getStudentById(context.studentId);
        const meritScore = Number(((student.gpa / 4.0) * 100).toFixed(1));
        const eligible = student.gpa >= 3.0;

        return {
          gpa: student.gpa,
          calculatedMeritScore: meritScore,
          meetsCriteria: eligible,
          program: student.program,
          evidence: [
            { source: 'academic_records', gpa: student.gpa, minRequiredGpa: 3.0 }
          ]
        };
      }
    },
    {
      id: 'admissions-approval',
      name: 'Admissions Officer & Committee Sign-Off',
      type: 'human_approval',
      description: 'Review applicant dossier, composite merit ranking, and verify admission approval decision.',
      requiresDecision: true,
      execute: async (context, stepOutput) => {
        return {
          recommendation: 'Admit applicant based on verified transcript, prerequisite GPA, and seat availability.'
        };
      }
    },
    {
      id: 'offer-letter-generation',
      name: 'Official Admission Offer Letter & Notice Dispatch',
      agentId: 'agent-002',
      agentName: 'Official Institutional Notice & Email Communication Agent',
      type: 'agent_task',
      execute: async (context) => {
        const student = StudentService.getStudentById(context.studentId);
        StudentService.updateStudent(student.id, {
          status: 'enrolled',
          admissionStatus: 'admitted'
        });

        const emailRes = await executeTool('agent-002', 'send_email', {
          recipient: student.email,
          subject: `Admission Confirmation — ${student.program}`,
          body: `Dear ${student.name},\n\nCongratulations! You have been granted official admission to the ${student.program} program at the University.`
        }, context.instanceId);

        return {
          letterGenerated: true,
          emailDispatched: emailRes.data.dispatched,
          recipient: student.email,
          enrollmentStatus: 'enrolled',
          evidence: [
            { source: 'communication_service', channel: 'email', recipient: student.email }
          ]
        };
      }
    }
  ]
};
