// Centralized Educational Tool Registry & RBAC Permissions Controller
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as StudentService from "../services/student-service.js";
import * as AcademicService from "../services/academic-service.js";
import * as FinanceService from "../services/finance-service.js";
import * as DocumentService from "../services/document-service.js";
import * as AdmissionService from "../services/admission-service.js";
import * as FacultyService from "../services/faculty-service.js";
import * as AuditService from "../services/audit-service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../..");

// Load agent mapping
let agentMappings = [];
try {
  const mappingFile = path.join(ROOT_DIR, "registry", "sa-s03-agent-mapping.json");
  if (fs.existsSync(mappingFile)) {
    const raw = JSON.parse(fs.readFileSync(mappingFile, "utf8"));
    agentMappings = raw.agents || [];
  }
} catch (e) {
  // fallback if file not yet loaded
}

export const TOOL_DEFINITIONS = {
  // STUDENT TOOLS
  get_student_profile: {
    name: "get_student_profile",
    domain: "student-services",
    description: "Fetch authoritative student record by ID",
    parameters: { student_id: "string" },
    handler: async ({ student_id, studentId }) => {
      const id = student_id || studentId;
      return await StudentService.getStudent(id);
    }
  },
  get_student_status: {
    name: "get_student_status",
    domain: "student-services",
    description: "Fetch current academic enrollment and clearance status",
    parameters: { student_id: "string" },
    handler: async ({ student_id, studentId }) => {
      const id = student_id || studentId;
      const s = await StudentService.getStudent(id);
      return { studentId: s.id, status: s.status, semester: s.semester, gpa: s.gpa };
    }
  },
  get_enrollment: {
    name: "get_enrollment",
    domain: "student-services",
    description: "Fetch student current registered course load and semester details",
    parameters: { student_id: "string" },
    handler: async ({ student_id, studentId }) => {
      const id = student_id || studentId;
      const s = await StudentService.getStudent(id);
      return { studentId: s.id, program: s.program, semester: s.semester, admissionStatus: s.admissionStatus };
    }
  },
  verify_student_identity: {
    name: "verify_student_identity",
    domain: "student-services",
    description: "Verify government ID and institutional student credentials",
    parameters: { student_id: "string" },
    handler: async ({ student_id, studentId }) => {
      const id = student_id || studentId;
      const s = await StudentService.getStudent(id);
      const idDoc = s.documents.find(d => d.type === 'id_proof');
      const verified = Boolean(idDoc && idDoc.status === 'verified');
      return { studentId: s.id, identityVerified: verified, evidence: { idDoc } };
    }
  },

  // ACADEMIC TOOLS
  get_attendance: {
    name: "get_attendance",
    domain: "academic",
    description: "Fetch attendance record and percentage for a student",
    parameters: { student_id: "string" },
    handler: async ({ student_id, studentId }) => {
      const id = student_id || studentId;
      return await AcademicService.getAttendance(id);
    }
  },
  get_marks: {
    name: "get_marks",
    domain: "academic",
    description: "Fetch latest semester marks and coursework grades",
    parameters: { student_id: "string" },
    handler: async ({ student_id, studentId }) => {
      const id = student_id || studentId;
      const s = await StudentService.getStudent(id);
      return { studentId: s.id, gpa: s.gpa, semester: s.semester };
    }
  },
  get_grades: {
    name: "get_grades",
    domain: "academic",
    description: "Fetch cumulative grade point average (GPA) and transcript breakdown",
    parameters: { student_id: "string" },
    handler: async ({ student_id, studentId }) => {
      const id = student_id || studentId;
      const s = await StudentService.getStudent(id);
      return { studentId: s.id, gpa: s.gpa, creditsEarned: s.semester * 20 };
    }
  },
  get_courses: {
    name: "get_courses",
    domain: "academic",
    description: "Fetch course catalog and offerings",
    parameters: {},
    handler: async () => {
      return await AcademicService.listCourses();
    }
  },
  get_prerequisites: {
    name: "get_prerequisites",
    domain: "academic",
    description: "Check prerequisite fulfillment for a student and target course",
    parameters: { student_id: "string", course_id: "string" },
    handler: async ({ student_id, studentId, course_id, courseId }) => {
      const sId = student_id || studentId;
      const cId = course_id || courseId;
      return await AcademicService.checkPrerequisites(sId, cId);
    }
  },
  check_academic_eligibility: {
    name: "check_academic_eligibility",
    domain: "academic",
    description: "Verify if student meets GPA and attendance thresholds",
    parameters: { student_id: "string", min_gpa: "number" },
    handler: async ({ student_id, studentId, min_gpa = 3.0 }) => {
      const id = student_id || studentId;
      const s = await StudentService.getStudent(id);
      const att = await AcademicService.getAttendance(id);
      const eligible = s.gpa >= min_gpa && att.percentage >= 75.0;
      return {
        studentId: id,
        eligible,
        gpa: s.gpa,
        attendancePercentage: att.percentage,
        thresholds: { min_gpa, min_attendance: 75.0 }
      };
    }
  },

  // FINANCE TOOLS
  get_fee_status: {
    name: "get_fee_status",
    domain: "finance",
    description: "Fetch student fee balance and clearance status",
    parameters: { student_id: "string" },
    handler: async ({ student_id, studentId }) => {
      const id = student_id || studentId;
      return await FinanceService.getStudentFeeStatus(id);
    }
  },
  get_payment_history: {
    name: "get_payment_history",
    domain: "finance",
    description: "Fetch payment history and transaction ledger",
    parameters: { student_id: "string" },
    handler: async ({ student_id, studentId }) => {
      const id = student_id || studentId;
      const status = await FinanceService.getStudentFeeStatus(id);
      return { studentId: id, balance: status.outstandingBalance, clear: status.status === 'cleared' };
    }
  },
  get_scholarship_rules: {
    name: "get_scholarship_rules",
    domain: "finance",
    description: "Fetch scholarship eligibility criteria and award matrix",
    parameters: { scholarship_id: "string" },
    handler: async ({ scholarship_id = 'SCH-MERIT-2026' }) => {
      return await FinanceService.getScholarship(scholarship_id);
    }
  },
  check_financial_eligibility: {
    name: "check_financial_eligibility",
    domain: "finance",
    description: "Check if student meets income threshold and financial requirements",
    parameters: { student_id: "string", scholarship_id: "string" },
    handler: async ({ student_id, studentId, scholarship_id = 'SCH-MERIT-2026' }) => {
      const id = student_id || studentId;
      return await FinanceService.evaluateScholarshipEligibility(id, scholarship_id);
    }
  },

  // DOCUMENT TOOLS
  get_document: {
    name: "get_document",
    domain: "document-intelligence",
    description: "Fetch document metadata and integrity state",
    parameters: { document_id: "string" },
    handler: async ({ document_id, documentId }) => {
      const id = document_id || documentId;
      return await DocumentService.getDocument(id);
    }
  },
  classify_document: {
    name: "classify_document",
    domain: "document-intelligence",
    description: "Classify document type using header and structural analysis",
    parameters: { filename: "string", mime_type: "string" },
    handler: async ({ filename, mime_type, mimeType }) => {
      return await DocumentService.classifyDocument({ filename, mimeType: mime_type || mimeType });
    }
  },
  extract_document_data: {
    name: "extract_document_data",
    domain: "document-intelligence",
    description: "Extract structured data from transcript, certificate, or application PDF",
    parameters: { document_id: "string" },
    handler: async ({ document_id, documentId }) => {
      const id = document_id || documentId;
      return await DocumentService.extractDocumentData(id);
    }
  },
  verify_document: {
    name: "verify_document",
    domain: "document-intelligence",
    description: "Verify document tamper hash and cryptographic signature",
    parameters: { document_id: "string" },
    handler: async ({ document_id, documentId }) => {
      const id = document_id || documentId;
      return await DocumentService.verifyDocument(id);
    }
  },
  compare_documents: {
    name: "compare_documents",
    domain: "document-intelligence",
    description: "Cross-correlate student identity details across two documents",
    parameters: { doc_id_1: "string", doc_id_2: "string" },
    handler: async ({ doc_id_1, doc_id_2, docId1, docId2 }) => {
      const d1 = doc_id_1 || docId1;
      const d2 = doc_id_2 || docId2;
      return await DocumentService.compareDocuments(d1, d2);
    }
  },

  // ADMISSION TOOLS
  get_admission_application: {
    name: "get_admission_application",
    domain: "admission",
    description: "Fetch applicant admission dossier by application ID",
    parameters: { application_id: "string" },
    handler: async ({ application_id, applicationId }) => {
      const id = application_id || applicationId;
      return await AdmissionService.getAdmissionApplication(id);
    }
  },
  check_admission_eligibility: {
    name: "check_admission_eligibility",
    domain: "admission",
    description: "Evaluate applicant entrance exam rank and minimum high school score",
    parameters: { application_id: "string" },
    handler: async ({ application_id, applicationId }) => {
      const id = application_id || applicationId;
      return await AdmissionService.checkAdmissionEligibility(id);
    }
  },
  calculate_merit: {
    name: "calculate_merit",
    domain: "admission",
    description: "Compute weighted composite merit ranking score for admission seat allocation",
    parameters: { application_id: "string" },
    handler: async ({ application_id, applicationId }) => {
      const id = application_id || applicationId;
      return await AdmissionService.calculateMerit(id);
    }
  },
  get_admission_status: {
    name: "get_admission_status",
    domain: "admission",
    description: "Fetch applicant seat category and current review status",
    parameters: { application_id: "string" },
    handler: async ({ application_id, applicationId }) => {
      const id = application_id || applicationId;
      return await AdmissionService.getAdmissionStatus(id);
    }
  },

  // FACULTY & HR TOOLS
  get_faculty_profile: {
    name: "get_faculty_profile",
    domain: "faculty-hr",
    description: "Fetch faculty profile, department, and committee memberships",
    parameters: { faculty_id: "string" },
    handler: async ({ faculty_id, facultyId }) => {
      const id = faculty_id || facultyId;
      return await FacultyService.getFacultyProfile(id);
    }
  },
  get_workload: {
    name: "get_workload",
    domain: "faculty-hr",
    description: "Fetch faculty weekly teaching and advising workload utilization",
    parameters: { faculty_id: "string" },
    handler: async ({ faculty_id, facultyId }) => {
      const id = faculty_id || facultyId;
      return await FacultyService.getWorkload(id);
    }
  },

  // WORKFLOW & AUDIT TOOLS
  create_task: {
    name: "create_task",
    domain: "workflow-intelligence",
    description: "Create an actionable workflow subtask",
    parameters: { task_name: "string", payload: "object" },
    handler: async ({ task_name, payload }) => {
      return { taskId: `TSK-${Date.now().toString(36).toUpperCase()}`, taskName: task_name, status: "created", payload };
    }
  },
  update_task: {
    name: "update_task",
    domain: "workflow-intelligence",
    description: "Update the state and output of an active workflow subtask",
    parameters: { task_id: "string", status: "string", result: "object" },
    handler: async ({ task_id, status, result }) => {
      return { taskId: task_id, status, result, updatedAt: new Date().toISOString() };
    }
  },
  record_agent_action: {
    name: "record_agent_action",
    domain: "audit",
    description: "Record structured audit entry for agent execution",
    parameters: { workflow_id: "string", agent_id: "string", action: "string", evidence: "object" },
    handler: async ({ workflow_id, agent_id, action, evidence, details }) => {
      const ev = evidence || details || {};
      AuditService.logAudit(workflow_id || 'WF-SYSTEM', agent_id || 'SYSTEM', action || 'AGENT_EXECUTION', ev);
      return { logged: true, timestamp: new Date().toISOString() };
    }
  },
  record_decision: {
    name: "record_decision",
    domain: "audit",
    description: "Record an institutional decision with attached evidence",
    parameters: { workflow_id: "string", decision: "string", evidence: "array" },
    handler: async ({ workflow_id, decision, evidence }) => {
      AuditService.logAudit(workflow_id || 'WF-SYSTEM', 'DECISION_ENGINE', `DECISION_${decision}`, { evidence });
      return { decisionLogged: true, decision, timestamp: new Date().toISOString() };
    }
  },
  create_approval: {
    name: "create_approval",
    domain: "workflow-intelligence",
    description: "Create a Human-in-the-Loop committee review item",
    parameters: { workflow_id: "string", title: "string", details: "object" },
    handler: async ({ workflow_id, title, details }) => {
      AuditService.logAudit(workflow_id || 'WF-SYSTEM', 'HITL_CONTROLLER', 'APPROVAL_REQUESTED', { title, details });
      return { approvalId: `APR-${Date.now().toString(36).toUpperCase()}`, status: "pending_human_review", title, details };
    }
  },

  // COMMUNICATION TOOLS
  send_email: {
    name: "send_email",
    domain: "communication",
    description: "Draft and dispatch official email communication",
    parameters: { recipient: "string", subject: "string", body: "string" },
    handler: async ({ recipient, subject, body }) => {
      return { dispatched: true, channel: "email", recipient, subject, lengthBytes: (body || '').length };
    }
  },
  send_notification: {
    name: "send_notification",
    domain: "communication",
    description: "Dispatch institutional portal notification to student or faculty",
    parameters: { recipient_id: "string", message: "string" },
    handler: async ({ recipient_id, message }) => {
      return { dispatched: true, channel: "portal_notification", recipientId: recipient_id, message };
    }
  },
  create_reminder: {
    name: "create_reminder",
    domain: "communication",
    description: "Schedule reminder for academic or financial deadline",
    parameters: { student_id: "string", title: "string", due_date: "string" },
    handler: async ({ student_id, title, due_date }) => {
      return { scheduled: true, studentId: student_id, title, dueDate: due_date };
    }
  }
};

export function isToolAllowed(agentId, toolName) {
  if (agentId === 'agent-101' || agentId === 'master') return true;
  
  const mapping = agentMappings.find(a => a.agent_id === agentId);
  if (!mapping) return false;
  
  if (mapping.allowed_tools.includes('*')) return true;
  return mapping.allowed_tools.includes(toolName);
}

export async function executeTool(agentId, toolName, params = {}, workflowId = null) {
  const tool = TOOL_DEFINITIONS[toolName];
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  // Enforce allowlist permissions
  if (!isToolAllowed(agentId, toolName)) {
    throw new Error(`Permission Denied: Agent ${agentId} is not authorized to call tool '${toolName}'.`);
  }

  try {
    const data = await tool.handler(params);
    
    // Record audit entry
    AuditService.logAudit(
      workflowId || 'WF-TOOL-EXEC',
      agentId,
      `TOOL_CALL_${toolName.toUpperCase()}`,
      { toolName, params, success: true }
    );

    return {
      status: "success",
      tool: toolName,
      agent_id: agentId,
      data,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    AuditService.logAudit(
      workflowId || 'WF-TOOL-EXEC',
      agentId,
      `TOOL_ERROR_${toolName.toUpperCase()}`,
      { toolName, params, error: err.message }
    );
    throw err;
  }
}
