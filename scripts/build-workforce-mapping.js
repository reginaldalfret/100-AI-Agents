import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const AGENTS_DIR = path.join(ROOT_DIR, "agents");

// 10 Major Educational Functional Domains
const DOMAINS = {
  DOMAIN_1_STUDENT_SERVICES: {
    id: "student-services",
    name: "Student Services",
    description: "Student identity verification, enrollment status, profile management, and student service inquiries"
  },
  DOMAIN_2_ADMISSION: {
    id: "admission",
    name: "Admissions & Enrollment",
    description: "Application intake, admission eligibility, merit ranking calculation, seat allocation, and enrollment onboarding"
  },
  DOMAIN_3_ACADEMIC: {
    id: "academic",
    name: "Academics & Examination",
    description: "Attendance records, marks, grading, course catalogs, prerequisite checks, academic warnings, and graduation audits"
  },
  DOMAIN_4_DOCUMENT_INTELLIGENCE: {
    id: "document-intelligence",
    name: "Document Intelligence",
    description: "Document intake, PDF parsing, OCR/Vision extraction, certificate verification, and completeness checking"
  },
  DOMAIN_5_FINANCE: {
    id: "finance",
    name: "Finance & Financial Aid",
    description: "Tuition billing, fee balance checks, scholarship eligibility evaluation, financial documents, and fee clearance"
  },
  DOMAIN_6_FACULTY_HR: {
    id: "faculty-hr",
    name: "Faculty & Staff HR",
    description: "Faculty workloads, department advisors, committee approvals, leave verification, and institutional HR operations"
  },
  DOMAIN_7_ADMINISTRATION: {
    id: "administration",
    name: "Administration & Operations",
    description: "Administrative task orchestration, scheduling, compliance verification, and institutional records management"
  },
  DOMAIN_8_COMMUNICATION: {
    id: "communication",
    name: "Institutional Communication",
    description: "Official notifications, automated email drafts, SMS alerts, multilingual translations, and reminder scheduling"
  },
  DOMAIN_9_ANALYTICS: {
    id: "analytics",
    name: "Institutional Analytics & Reporting",
    description: "Academic trend analysis, attendance risk detection, financial reporting, SWOT assessments, and executive dashboards"
  },
  DOMAIN_10_WORKFLOW_INTELLIGENCE: {
    id: "workflow-intelligence",
    name: "Workflow & Multi-Agent Intelligence",
    description: "Multi-agent coordination, task decomposition, dependency tracking, failure recovery, and workflow execution"
  },
  DOMAIN_MASTER: {
    id: "master-orchestration",
    name: "Master Workflow Orchestration",
    description: "Central dynamic planner and institutional workflow governor"
  }
};

// Precise Mapping Rule based on agent_id & primary capabilities
function mapAgentToWorkforce(agent) {
  const id = agent.id || agent.agent_id;
  const num = parseInt(id.replace("agent-", ""), 10);
  const name = agent.name;
  const origCategory = agent.category;

  let domain = DOMAINS.DOMAIN_7_ADMINISTRATION;
  let classification = "SUPPORT";
  let educationalRole = "Administrative Support Agent";
  let educationalCapabilities = [...(agent.capabilities || [])];
  let allowedTools = ["get_student_status", "record_agent_action", "create_task"];
  let workflowRoles = ["administrative-request"];

  if (num === 101) {
    domain = DOMAINS.DOMAIN_MASTER;
    classification = "ORCHESTRATION";
    educationalRole = "Educational Master Workflow Orchestrator";
    educationalCapabilities = ["workflow-planning", "agent-selection", "task-decomposition", "result-synthesis", "multi-agent-orchestration"];
    allowedTools = ["*"]; // Orchestrator coordinates all
    workflowRoles = ["admission-verification", "scholarship-eligibility", "attendance-intervention", "course-override", "graduation-clearance"];
  }
  // Document Intelligence Agents
  else if ([37, 45, 51, 52, 93].includes(num)) {
    domain = DOMAINS.DOMAIN_4_DOCUMENT_INTELLIGENCE;
    classification = "DIRECT_REUSE";
    if (num === 45) {
      educationalRole = "Institutional PDF & Transcript Processing Agent";
      educationalCapabilities = ["pdf-processing", "transcript-extraction", "document-parsing", "data-extraction"];
      allowedTools = ["get_document", "extract_document_data", "classify_document", "record_agent_action"];
      workflowRoles = ["admission-verification", "scholarship-eligibility", "graduation-clearance"];
    } else if (num === 51) {
      educationalRole = "Institutional Certificate & ID Image Verification Agent";
      educationalCapabilities = ["image-analysis", "id-verification", "certificate-verification", "tamper-detection"];
      allowedTools = ["get_document", "verify_document", "compare_documents", "record_agent_action"];
      workflowRoles = ["admission-verification", "scholarship-eligibility"];
    } else if (num === 37) {
      educationalRole = "Institutional Document Research & Policy Lookup Agent";
      allowedTools = ["get_document", "classify_document", "record_agent_action"];
      workflowRoles = ["admission-verification", "graduation-clearance"];
    } else {
      educationalRole = "Document Intelligence & Knowledge Extraction Agent";
      allowedTools = ["get_document", "extract_document_data", "record_agent_action"];
      workflowRoles = ["admission-verification", "scholarship-eligibility"];
    }
  }
  // Student Services Agents
  else if ([13, 14, 18, 40, 60, 78].includes(num)) {
    domain = DOMAINS.DOMAIN_1_STUDENT_SERVICES;
    classification = [13, 18, 40].includes(num) ? "DIRECT_REUSE" : "REPURPOSE";
    if (num === 18) {
      educationalRole = "Student Academic & Career Advisory Agent";
      educationalCapabilities = ["student-advisory", "career-counseling", "academic-pathway", "internship-guidance"];
      allowedTools = ["get_student_profile", "get_grades", "get_courses", "record_agent_action"];
      workflowRoles = ["course-override", "graduation-clearance"];
    } else if (num === 40 || num === 60) {
      educationalRole = "Student Verification & Profile Intake Agent";
      educationalCapabilities = ["student-verification", "identity-validation", "profile-lookup", "enrollment-check"];
      allowedTools = ["get_student_profile", "get_student_status", "verify_student_identity", "record_agent_action"];
      workflowRoles = ["admission-verification", "scholarship-eligibility", "attendance-intervention", "course-override", "graduation-clearance"];
    } else {
      educationalRole = "Student Support & Inquiries Agent";
      allowedTools = ["get_student_profile", "get_student_status", "record_agent_action"];
      workflowRoles = ["student-service"];
    }
  }
  // Admission Agents
  else if ([15, 76, 77, 98].includes(num)) {
    domain = DOMAINS.DOMAIN_2_ADMISSION;
    classification = "REPURPOSE";
    if (num === 15) {
      educationalRole = "Applicant Interview & Screening Assessment Agent";
      educationalCapabilities = ["applicant-screening", "interview-evaluation", "admission-assessment"];
      allowedTools = ["get_admission_application", "check_admission_eligibility", "record_agent_action"];
      workflowRoles = ["admission-verification"];
    } else if (num === 77 || num === 76) {
      educationalRole = "Admission Application Intake & Merit Evaluation Agent";
      educationalCapabilities = ["application-intake", "merit-calculation", "admission-eligibility", "seat-allocation"];
      allowedTools = ["get_admission_application", "calculate_merit", "check_admission_eligibility", "record_agent_action"];
      workflowRoles = ["admission-verification"];
    } else {
      educationalRole = "Admission Program Onboarding Agent";
      allowedTools = ["get_admission_application", "record_agent_action"];
      workflowRoles = ["admission-verification"];
    }
  }
  // Academic & Examination Agents
  else if ([3, 4, 6, 10, 11, 34, 35, 55, 56, 57, 67].includes(num)) {
    domain = DOMAINS.DOMAIN_3_ACADEMIC;
    classification = "DIRECT_REUSE";
    if (num === 3) {
      educationalRole = "Curriculum & Academic Study Plan Agent";
      educationalCapabilities = ["study-planning", "curriculum-evaluation", "academic-coaching", "learning-path"];
      allowedTools = ["get_courses", "get_marks", "get_prerequisites", "record_agent_action"];
      workflowRoles = ["attendance-intervention", "course-override"];
    } else if (num === 4) {
      educationalRole = "Academic Examination & Assessment Validation Agent";
      educationalCapabilities = ["exam-evaluation", "assessment-grading", "quiz-validation", "rubric-scoring"];
      allowedTools = ["get_marks", "get_grades", "record_agent_action"];
      workflowRoles = ["graduation-clearance"];
    } else if (num === 34 || num === 35) {
      educationalRole = "Course Catalog & Prerequisite Validation Agent";
      educationalCapabilities = ["course-validation", "prerequisite-checking", "credit-audit", "degree-requirements"];
      allowedTools = ["get_courses", "get_prerequisites", "check_academic_eligibility", "record_agent_action"];
      workflowRoles = ["course-override", "graduation-clearance"];
    } else {
      educationalRole = "Academic Performance & Course Records Agent";
      allowedTools = ["get_attendance", "get_marks", "get_grades", "record_agent_action"];
      workflowRoles = ["attendance-intervention", "graduation-clearance"];
    }
  }
  // Finance & Financial Aid Agents
  else if ([46, 85, 86, 87, 88].includes(num)) {
    domain = DOMAINS.DOMAIN_5_FINANCE;
    classification = "DIRECT_REUSE";
    if (num === 46) {
      educationalRole = "Institutional Fee Invoice & Receipt Verification Agent";
      educationalCapabilities = ["invoice-processing", "receipt-verification", "fee-ledgering", "payment-audit"];
      allowedTools = ["get_fee_status", "get_payment_history", "record_agent_action"];
      workflowRoles = ["scholarship-eligibility", "graduation-clearance"];
    } else if (num === 85) {
      educationalRole = "Scholarship & Financial Aid Eligibility Evaluator Agent";
      educationalCapabilities = ["financial-analysis", "scholarship-evaluation", "income-threshold-check", "award-calculation"];
      allowedTools = ["get_fee_status", "get_scholarship_rules", "check_financial_eligibility", "record_agent_action"];
      workflowRoles = ["scholarship-eligibility"];
    } else {
      educationalRole = "Institutional Accounting & Ledger Balance Agent";
      allowedTools = ["get_fee_status", "get_payment_history", "record_agent_action"];
      workflowRoles = ["scholarship-eligibility", "graduation-clearance"];
    }
  }
  // Faculty / HR Agents
  else if ([42, 53, 89, 90].includes(num)) {
    domain = DOMAINS.DOMAIN_6_FACULTY_HR;
    classification = "REPURPOSE";
    if (num === 89) {
      educationalRole = "Faculty Affairs & Departmental Committee HR Agent";
      educationalCapabilities = ["faculty-records", "committee-coordination", "leave-verification", "workload-allocation"];
      allowedTools = ["get_faculty_profile", "get_workload", "create_approval", "record_agent_action"];
      workflowRoles = ["course-override", "scholarship-eligibility"];
    } else if (num === 42 || num === 53) {
      educationalRole = "Academic Scheduling & Committee Meeting Assistant Agent";
      allowedTools = ["get_faculty_profile", "create_reminder", "record_agent_action"];
      workflowRoles = ["attendance-intervention", "course-override"];
    } else {
      educationalRole = "Institutional Operations & Faculty Process Agent";
      allowedTools = ["get_faculty_profile", "create_task", "record_agent_action"];
      workflowRoles = ["attendance-intervention"];
    }
  }
  // Institutional Communication Agents
  else if ([1, 2, 7, 8, 9, 16, 41, 54, 58, 80, 81, 83].includes(num)) {
    domain = DOMAINS.DOMAIN_8_COMMUNICATION;
    classification = "DIRECT_REUSE";
    if (num === 2 || num === 41) {
      educationalRole = "Official Institutional Notice & Email Communication Agent";
      educationalCapabilities = ["email-writing", "official-notice", "student-notification", "faculty-dispatch"];
      allowedTools = ["send_email", "send_notification", "create_reminder", "record_agent_action"];
      workflowRoles = ["admission-verification", "scholarship-eligibility", "attendance-intervention", "course-override", "graduation-clearance"];
    } else if (num === 7) {
      educationalRole = "Multilingual Student Translation & Accessibility Agent";
      educationalCapabilities = ["translation", "multilingual-notices", "localization", "language-support"];
      allowedTools = ["send_notification", "record_agent_action"];
      workflowRoles = ["admission-verification", "student-service"];
    } else if (num === 1) {
      educationalRole = "Institutional Formal Document & Letter Drafting Agent";
      educationalCapabilities = ["official-letter-drafting", "formal-communication", "clearance-memo", "admissions-offer"];
      allowedTools = ["send_notification", "record_agent_action"];
      workflowRoles = ["admission-verification", "graduation-clearance"];
    } else {
      educationalRole = "Campus Announcement & Student Engagement Agent";
      allowedTools = ["send_notification", "create_reminder", "record_agent_action"];
      workflowRoles = ["attendance-intervention", "student-service"];
    }
  }
  // Institutional Analytics & Reporting
  else if ([17, 19, 20, 26, 27, 28, 29, 30, 31, 38, 39, 47, 48, 49, 50, 82, 84, 97].includes(num)) {
    domain = DOMAINS.DOMAIN_9_ANALYTICS;
    classification = "DIRECT_REUSE";
    if (num === 48) {
      educationalRole = "Institutional Academic & Attendance Analytics Agent";
      educationalCapabilities = ["data-analysis", "attendance-analytics", "dropout-risk-scoring", "grade-distribution"];
      allowedTools = ["get_attendance", "get_marks", "get_grades", "record_agent_action"];
      workflowRoles = ["attendance-intervention", "graduation-clearance"];
    } else if (num === 49) {
      educationalRole = "Institutional Performance & Accreditation Reporting Agent";
      educationalCapabilities = ["report-generation", "compliance-reporting", "executive-briefing", "accreditation-metrics"];
      allowedTools = ["get_attendance", "get_marks", "get_fee_status", "record_agent_action"];
      workflowRoles = ["graduation-clearance", "attendance-intervention"];
    } else if (num === 38 || num === 39) {
      educationalRole = "Institutional Data Verification & Fact-Checking Agent";
      allowedTools = ["get_student_profile", "get_marks", "verify_document", "record_agent_action"];
      workflowRoles = ["admission-verification", "scholarship-eligibility"];
    } else {
      educationalRole = "Institutional Operations Intelligence & Assessment Agent";
      allowedTools = ["get_attendance", "get_fee_status", "record_agent_action"];
      workflowRoles = ["attendance-intervention", "administrative-request"];
    }
  }
  // Workflow & Multi-Agent Intelligence
  else if ([59, 71, 72, 73, 74, 75, 91, 92, 94, 95, 96, 99, 100].includes(num)) {
    domain = DOMAINS.DOMAIN_10_WORKFLOW_INTELLIGENCE;
    classification = "ORCHESTRATION";
    if (num === 100) {
      educationalRole = "Sub-Workflow Orchestration & Task Execution Agent";
      educationalCapabilities = ["workflow-orchestration", "subtask-dispatch", "pipeline-monitoring", "agent-delegation"];
      allowedTools = ["create_task", "update_task", "get_workflow_status", "record_agent_action"];
      workflowRoles = ["admission-verification", "scholarship-eligibility", "attendance-intervention", "course-override", "graduation-clearance"];
    } else if (num === 99) {
      educationalRole = "Multi-Agent Consensus & Evidence Aggregator Agent";
      educationalCapabilities = ["agent-coordination", "consensus-verification", "evidence-aggregation", "conflict-resolution"];
      allowedTools = ["record_decision", "record_agent_action", "create_approval"];
      workflowRoles = ["scholarship-eligibility", "graduation-clearance"];
    } else if (num === 71) {
      educationalRole = "Institutional Data Gateway & Persistence Agent";
      educationalCapabilities = ["database-querying", "data-persistence", "record-lookup", "schema-validation"];
      allowedTools = ["get_student_profile", "get_courses", "get_fee_status", "record_agent_action"];
      workflowRoles = ["admission-verification", "scholarship-eligibility", "course-override", "graduation-clearance"];
    } else {
      educationalRole = "Automated Workflow Pipeline & Task Handler Agent";
      allowedTools = ["create_task", "update_task", "record_agent_action"];
      workflowRoles = ["administrative-request"];
    }
  }
  // Domain 7 Administration fallback
  else {
    domain = DOMAINS.DOMAIN_7_ADMINISTRATION;
    classification = "SUPPORT";
    educationalRole = "Institutional Administrative Operations Agent";
    allowedTools = ["get_student_status", "create_task", "record_agent_action"];
    workflowRoles = ["administrative-request"];
  }

  return {
    agent_id: id,
    day: num,
    original_name: name,
    educational_name: educationalRole,
    educational_domain: domain.id,
    domain_name: domain.name,
    classification,
    educational_capabilities: educationalCapabilities,
    allowed_tools: allowedTools,
    workflow_roles: workflowRoles,
    port: 8100 + num,
    model: agent.model || "nemotron-3-nano",
    status: "active"
  };
}

console.log("Building SA-S03 Educational Workforce Mapping...");
const agents = [];

for (let i = 1; i <= 101; i++) {
  const pad = String(i).padStart(3, "0");
  const agentDirName = fs.readdirSync(AGENTS_DIR).find(d => d.startsWith(`agent-${pad}`));
  if (!agentDirName) continue;
  
  const jsonPath = path.join(AGENTS_DIR, agentDirName, "agent.json");
  if (!fs.existsSync(jsonPath)) continue;

  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const mapped = mapAgentToWorkforce(raw);
  agents.push(mapped);
}

console.log(`Mapped ${agents.length} agents across 10 Educational Domains.`);

// Ensure docs/ and registry/ directories exist
fs.mkdirSync(path.join(ROOT_DIR, "docs"), { recursive: true });
fs.mkdirSync(path.join(ROOT_DIR, "registry"), { recursive: true });

// Write registry/sa-s03-agent-mapping.json
const mappingJsonPath = path.join(ROOT_DIR, "registry", "sa-s03-agent-mapping.json");
fs.writeFileSync(mappingJsonPath, JSON.stringify({
  version: "1.0.0",
  generated_at: new Date().toISOString(),
  total_workforce_agents: agents.length,
  domains: Object.values(DOMAINS),
  agents
}, null, 2), "utf8");
console.log(`Wrote JSON mapping: ${mappingJsonPath}`);

// Write docs/sa-s03-agent-workforce-map.md
let md = `# SA-S03 Educational Agent Workforce Mapping

**System:** Educational Intelligent Workflow Management Platform  
**Model Backend:** NVIDIA Nemotron 3 Nano 4B Q4_K_M via Ollama  
**Total Workforce:** ${agents.length} Specialized Agents (100 Domain Specialists + 1 Master Orchestrator)  
**Date:** ${new Date().toUTCString()}  

---

## 1. Executive Taxonomy Breakdown

| Domain ID | Educational Domain | Total Agents | Key Workflow Responsibilities |
| :--- | :--- | :---: | :--- |
| **\`student-services\`** | Student Services | ${agents.filter(a => a.educational_domain === 'student-services').length} | Student verification, profile management, enrollment status, advisory |
| **\`admission\`** | Admissions & Enrollment | ${agents.filter(a => a.educational_domain === 'admission').length} | Application intake, merit calculation, interview screening, seat allocation |
| **\`academic\`** | Academics & Examination | ${agents.filter(a => a.educational_domain === 'academic').length} | Attendance, grades, marks, course catalogs, prerequisite checks |
| **\`document-intelligence\`** | Document Intelligence | ${agents.filter(a => a.educational_domain === 'document-intelligence').length} | PDF parsing, OCR/Vision extraction, certificate tamper verification |
| **\`finance\`** | Finance & Financial Aid | ${agents.filter(a => a.educational_domain === 'finance').length} | Fee billing, receipts, scholarship eligibility, ledger clearance |
| **\`faculty-hr\`** | Faculty & Staff HR | ${agents.filter(a => a.educational_domain === 'faculty-hr').length} | Faculty advisors, workload, committee reviews, departmental approvals |
| **\`administration\`** | Administration & Operations | ${agents.filter(a => a.educational_domain === 'administration').length} | Task management, scheduling, records archiving, institutional compliance |
| **\`communication\`** | Institutional Communication | ${agents.filter(a => a.educational_domain === 'communication').length} | Formal decision memos, emails, multilingual notices, SMS alerts |
| **\`analytics\`** | Institutional Analytics & Reporting | ${agents.filter(a => a.educational_domain === 'analytics').length} | Risk detection, attendance analytics, performance reporting, dashboards |
| **\`workflow-intelligence\`** | Workflow & Multi-Agent Intelligence | ${agents.filter(a => a.educational_domain === 'workflow-intelligence').length} | Consensus aggregation, subtask dispatch, pipeline execution |
| **\`master-orchestration\`** | Master Workflow Orchestration | 1 | Dynamic decomposition, agent selection, HITL coordination, synthesis |

---

## 2. Workforce Classification Summary

- **DIRECT_REUSE:** ${agents.filter(a => a.classification === 'DIRECT_REUSE').length} Agents
- **REPURPOSE:** ${agents.filter(a => a.classification === 'REPURPOSE').length} Agents
- **SUPPORT:** ${agents.filter(a => a.classification === 'SUPPORT').length} Agents
- **ORCHESTRATION:** ${agents.filter(a => a.classification === 'ORCHESTRATION').length} Agents

---

## 3. Complete 101-Agent Workforce Registry

| Agent ID | Original Name | Educational Workforce Role | Domain | Classification | Assigned Tools | Workflow Roles |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
`;

for (const a of agents) {
  md += `| \`${a.agent_id}\` | ${a.original_name} | **${a.educational_name}** | \`${a.educational_domain}\` | \`${a.classification}\` | \`${a.allowed_tools.slice(0, 2).join(', ')}${a.allowed_tools.length > 2 ? '...' : ''}\` | ${a.workflow_roles.join(', ')} |\n`;
}

const mdPath = path.join(ROOT_DIR, "docs", "sa-s03-agent-workforce-map.md");
fs.writeFileSync(mdPath, md, "utf8");
console.log(`Wrote Markdown mapping: ${mdPath}`);
