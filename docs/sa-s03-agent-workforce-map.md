# SA-S03 Educational Agent Workforce Mapping

**System:** Educational Intelligent Workflow Management Platform  
**Model Backend:** NVIDIA Nemotron 3 Nano 4B Q4_K_M via Ollama  
**Total Workforce:** 101 Specialized Agents (100 Domain Specialists + 1 Master Orchestrator)  
**Date:** Wed, 19 Aug 2026 07:11:16 GMT  

---

## 1. Executive Taxonomy Breakdown

| Domain ID | Educational Domain | Total Agents | Key Workflow Responsibilities |
| :--- | :--- | :---: | :--- |
| **`student-services`** | Student Services | 6 | Student verification, profile management, enrollment status, advisory |
| **`admission`** | Admissions & Enrollment | 4 | Application intake, merit calculation, interview screening, seat allocation |
| **`academic`** | Academics & Examination | 11 | Attendance, grades, marks, course catalogs, prerequisite checks |
| **`document-intelligence`** | Document Intelligence | 5 | PDF parsing, OCR/Vision extraction, certificate tamper verification |
| **`finance`** | Finance & Financial Aid | 5 | Fee billing, receipts, scholarship eligibility, ledger clearance |
| **`faculty-hr`** | Faculty & Staff HR | 4 | Faculty advisors, workload, committee reviews, departmental approvals |
| **`administration`** | Administration & Operations | 22 | Task management, scheduling, records archiving, institutional compliance |
| **`communication`** | Institutional Communication | 12 | Formal decision memos, emails, multilingual notices, SMS alerts |
| **`analytics`** | Institutional Analytics & Reporting | 18 | Risk detection, attendance analytics, performance reporting, dashboards |
| **`workflow-intelligence`** | Workflow & Multi-Agent Intelligence | 13 | Consensus aggregation, subtask dispatch, pipeline execution |
| **`master-orchestration`** | Master Workflow Orchestration | 1 | Dynamic decomposition, agent selection, HITL coordination, synthesis |

---

## 2. Workforce Classification Summary

- **DIRECT_REUSE:** 54 Agents
- **REPURPOSE:** 11 Agents
- **SUPPORT:** 22 Agents
- **ORCHESTRATION:** 14 Agents

---

## 3. Complete 101-Agent Workforce Registry

| Agent ID | Original Name | Educational Workforce Role | Domain | Classification | Assigned Tools | Workflow Roles |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| `agent-001` | AI Writing Agent | **Institutional Formal Document & Letter Drafting Agent** | `communication` | `DIRECT_REUSE` | `send_notification, record_agent_action` | admission-verification, graduation-clearance |
| `agent-002` | AI Email Agent | **Official Institutional Notice & Email Communication Agent** | `communication` | `DIRECT_REUSE` | `send_email, send_notification...` | admission-verification, scholarship-eligibility, attendance-intervention, course-override, graduation-clearance |
| `agent-003` | AI Study Agent | **Curriculum & Academic Study Plan Agent** | `academic` | `DIRECT_REUSE` | `get_courses, get_marks...` | attendance-intervention, course-override |
| `agent-004` | AI Quiz Agent | **Academic Examination & Assessment Validation Agent** | `academic` | `DIRECT_REUSE` | `get_marks, get_grades...` | graduation-clearance |
| `agent-005` | AI Summarization Agent | **Institutional Administrative Operations Agent** | `administration` | `SUPPORT` | `get_student_status, create_task...` | administrative-request |
| `agent-006` | AI Grammar Agent | **Academic Performance & Course Records Agent** | `academic` | `DIRECT_REUSE` | `get_attendance, get_marks...` | attendance-intervention, graduation-clearance |
| `agent-007` | AI Translation Agent | **Multilingual Student Translation & Accessibility Agent** | `communication` | `DIRECT_REUSE` | `send_notification, record_agent_action` | admission-verification, student-service |
| `agent-008` | AI Idea Generation Agent | **Campus Announcement & Student Engagement Agent** | `communication` | `DIRECT_REUSE` | `send_notification, create_reminder...` | attendance-intervention, student-service |
| `agent-009` | AI Storytelling Agent | **Campus Announcement & Student Engagement Agent** | `communication` | `DIRECT_REUSE` | `send_notification, create_reminder...` | attendance-intervention, student-service |
| `agent-010` | AI Goal Planning Agent | **Academic Performance & Course Records Agent** | `academic` | `DIRECT_REUSE` | `get_attendance, get_marks...` | attendance-intervention, graduation-clearance |
| `agent-011` | AI Note-Taking Agent | **Academic Performance & Course Records Agent** | `academic` | `DIRECT_REUSE` | `get_attendance, get_marks...` | attendance-intervention, graduation-clearance |
| `agent-012` | AI Task Management Agent | **Institutional Administrative Operations Agent** | `administration` | `SUPPORT` | `get_student_status, create_task...` | administrative-request |
| `agent-013` | AI Resume Agent | **Student Support & Inquiries Agent** | `student-services` | `DIRECT_REUSE` | `get_student_profile, get_student_status...` | student-service |
| `agent-014` | AI Job Matching Agent | **Student Support & Inquiries Agent** | `student-services` | `REPURPOSE` | `get_student_profile, get_student_status...` | student-service |
| `agent-015` | AI Interview Agent | **Applicant Interview & Screening Assessment Agent** | `admission` | `REPURPOSE` | `get_admission_application, check_admission_eligibility...` | admission-verification |
| `agent-016` | AI Communication Agent | **Campus Announcement & Student Engagement Agent** | `communication` | `DIRECT_REUSE` | `send_notification, create_reminder...` | attendance-intervention, student-service |
| `agent-017` | AI SWOT Analysis Agent | **Institutional Operations Intelligence & Assessment Agent** | `analytics` | `DIRECT_REUSE` | `get_attendance, get_fee_status...` | attendance-intervention, administrative-request |
| `agent-018` | AI Career Advisor Agent | **Student Academic & Career Advisory Agent** | `student-services` | `DIRECT_REUSE` | `get_student_profile, get_grades...` | course-override, graduation-clearance |
| `agent-019` | AI Decision-Making Agent | **Institutional Operations Intelligence & Assessment Agent** | `analytics` | `DIRECT_REUSE` | `get_attendance, get_fee_status...` | attendance-intervention, administrative-request |
| `agent-020` | AI Brainstorming Agent | **Institutional Operations Intelligence & Assessment Agent** | `analytics` | `DIRECT_REUSE` | `get_attendance, get_fee_status...` | attendance-intervention, administrative-request |
| `agent-021` | AI Web Research Agent | **Institutional Administrative Operations Agent** | `administration` | `SUPPORT` | `get_student_status, create_task...` | administrative-request |
| `agent-022` | AI News Research Agent | **Institutional Administrative Operations Agent** | `administration` | `SUPPORT` | `get_student_status, create_task...` | administrative-request |
| `agent-023` | AI Research Paper Agent | **Institutional Administrative Operations Agent** | `administration` | `SUPPORT` | `get_student_status, create_task...` | administrative-request |
| `agent-024` | AI Literature Review Agent | **Institutional Administrative Operations Agent** | `administration` | `SUPPORT` | `get_student_status, create_task...` | administrative-request |
| `agent-025` | AI Book Research Agent | **Institutional Administrative Operations Agent** | `administration` | `SUPPORT` | `get_student_status, create_task...` | administrative-request |
| `agent-026` | AI Company Research Agent | **Institutional Operations Intelligence & Assessment Agent** | `analytics` | `DIRECT_REUSE` | `get_attendance, get_fee_status...` | attendance-intervention, administrative-request |
| `agent-027` | AI Competitor Research Agent | **Institutional Operations Intelligence & Assessment Agent** | `analytics` | `DIRECT_REUSE` | `get_attendance, get_fee_status...` | attendance-intervention, administrative-request |
| `agent-028` | AI Market Research Agent | **Institutional Operations Intelligence & Assessment Agent** | `analytics` | `DIRECT_REUSE` | `get_attendance, get_fee_status...` | attendance-intervention, administrative-request |
| `agent-029` | AI Startup Research Agent | **Institutional Operations Intelligence & Assessment Agent** | `analytics` | `DIRECT_REUSE` | `get_attendance, get_fee_status...` | attendance-intervention, administrative-request |
| `agent-030` | AI Investment Research Agent | **Institutional Operations Intelligence & Assessment Agent** | `analytics` | `DIRECT_REUSE` | `get_attendance, get_fee_status...` | attendance-intervention, administrative-request |
| `agent-031` | AI Product Research Agent | **Institutional Operations Intelligence & Assessment Agent** | `analytics` | `DIRECT_REUSE` | `get_attendance, get_fee_status...` | attendance-intervention, administrative-request |
| `agent-032` | AI Travel Research Agent | **Institutional Administrative Operations Agent** | `administration` | `SUPPORT` | `get_student_status, create_task...` | administrative-request |
| `agent-033` | AI Restaurant Research Agent | **Institutional Administrative Operations Agent** | `administration` | `SUPPORT` | `get_student_status, create_task...` | administrative-request |
| `agent-034` | AI Course Research Agent | **Course Catalog & Prerequisite Validation Agent** | `academic` | `DIRECT_REUSE` | `get_courses, get_prerequisites...` | course-override, graduation-clearance |
| `agent-035` | AI College Research Agent | **Course Catalog & Prerequisite Validation Agent** | `academic` | `DIRECT_REUSE` | `get_courses, get_prerequisites...` | course-override, graduation-clearance |
| `agent-036` | AI GitHub Research Agent | **Institutional Administrative Operations Agent** | `administration` | `SUPPORT` | `get_student_status, create_task...` | administrative-request |
| `agent-037` | AI Document Research Agent | **Institutional Document Research & Policy Lookup Agent** | `document-intelligence` | `DIRECT_REUSE` | `get_document, classify_document...` | admission-verification, graduation-clearance |
| `agent-038` | AI Fact-Checking Agent | **Institutional Data Verification & Fact-Checking Agent** | `analytics` | `DIRECT_REUSE` | `get_student_profile, get_marks...` | admission-verification, scholarship-eligibility |
| `agent-039` | AI Source Verification Agent | **Institutional Data Verification & Fact-Checking Agent** | `analytics` | `DIRECT_REUSE` | `get_student_profile, get_marks...` | admission-verification, scholarship-eligibility |
| `agent-040` | AI Research Assistant Agent | **Student Verification & Profile Intake Agent** | `student-services` | `DIRECT_REUSE` | `get_student_profile, get_student_status...` | admission-verification, scholarship-eligibility, attendance-intervention, course-override, graduation-clearance |
| `agent-041` | AI Email Management Agent | **Official Institutional Notice & Email Communication Agent** | `communication` | `DIRECT_REUSE` | `send_email, send_notification...` | admission-verification, scholarship-eligibility, attendance-intervention, course-override, graduation-clearance |
| `agent-042` | AI Calendar Management Agent | **Academic Scheduling & Committee Meeting Assistant Agent** | `faculty-hr` | `REPURPOSE` | `get_faculty_profile, create_reminder...` | attendance-intervention, course-override |
| `agent-043` | AI Task Automation Agent | **Institutional Administrative Operations Agent** | `administration` | `SUPPORT` | `get_student_status, create_task...` | administrative-request |
| `agent-044` | AI File Organization Agent | **Institutional Administrative Operations Agent** | `administration` | `SUPPORT` | `get_student_status, create_task...` | administrative-request |
| `agent-045` | AI PDF Processing Agent | **Institutional PDF & Transcript Processing Agent** | `document-intelligence` | `DIRECT_REUSE` | `get_document, extract_document_data...` | admission-verification, scholarship-eligibility, graduation-clearance |
| `agent-046` | AI Invoice Processing Agent | **Institutional Fee Invoice & Receipt Verification Agent** | `finance` | `DIRECT_REUSE` | `get_fee_status, get_payment_history...` | scholarship-eligibility, graduation-clearance |
| `agent-047` | AI Spreadsheet Agent | **Institutional Operations Intelligence & Assessment Agent** | `analytics` | `DIRECT_REUSE` | `get_attendance, get_fee_status...` | attendance-intervention, administrative-request |
| `agent-048` | AI Data Analysis Agent | **Institutional Academic & Attendance Analytics Agent** | `analytics` | `DIRECT_REUSE` | `get_attendance, get_marks...` | attendance-intervention, graduation-clearance |
| `agent-049` | AI Report Generation Agent | **Institutional Performance & Accreditation Reporting Agent** | `analytics` | `DIRECT_REUSE` | `get_attendance, get_marks...` | graduation-clearance, attendance-intervention |
| `agent-050` | AI Presentation Agent | **Institutional Operations Intelligence & Assessment Agent** | `analytics` | `DIRECT_REUSE` | `get_attendance, get_fee_status...` | attendance-intervention, administrative-request |
| `agent-051` | AI Image Analysis Agent | **Institutional Certificate & ID Image Verification Agent** | `document-intelligence` | `DIRECT_REUSE` | `get_document, verify_document...` | admission-verification, scholarship-eligibility |
| `agent-052` | AI Video Analysis Agent | **Document Intelligence & Knowledge Extraction Agent** | `document-intelligence` | `DIRECT_REUSE` | `get_document, extract_document_data...` | admission-verification, scholarship-eligibility |
| `agent-053` | AI Meeting Assistant Agent | **Academic Scheduling & Committee Meeting Assistant Agent** | `faculty-hr` | `REPURPOSE` | `get_faculty_profile, create_reminder...` | attendance-intervention, course-override |
| `agent-054` | AI Voice Assistant Agent | **Campus Announcement & Student Engagement Agent** | `communication` | `DIRECT_REUSE` | `send_notification, create_reminder...` | attendance-intervention, student-service |
| `agent-055` | AI Code Review Agent | **Academic Performance & Course Records Agent** | `academic` | `DIRECT_REUSE` | `get_attendance, get_marks...` | attendance-intervention, graduation-clearance |
| `agent-056` | AI Debugging Agent | **Academic Performance & Course Records Agent** | `academic` | `DIRECT_REUSE` | `get_attendance, get_marks...` | attendance-intervention, graduation-clearance |
| `agent-057` | AI Test Generation Agent | **Academic Performance & Course Records Agent** | `academic` | `DIRECT_REUSE` | `get_attendance, get_marks...` | attendance-intervention, graduation-clearance |
| `agent-058` | AI Documentation Agent | **Campus Announcement & Student Engagement Agent** | `communication` | `DIRECT_REUSE` | `send_notification, create_reminder...` | attendance-intervention, student-service |
| `agent-059` | AI Workflow Automation Agent | **Automated Workflow Pipeline & Task Handler Agent** | `workflow-intelligence` | `ORCHESTRATION` | `create_task, update_task...` | administrative-request |
| `agent-060` | AI Personal Assistant Agent | **Student Verification & Profile Intake Agent** | `student-services` | `REPURPOSE` | `get_student_profile, get_student_status...` | admission-verification, scholarship-eligibility, attendance-intervention, course-override, graduation-clearance |
| `agent-061` | AI Code Generation Agent | **Institutional Administrative Operations Agent** | `administration` | `SUPPORT` | `get_student_status, create_task...` | administrative-request |
| `agent-062` | AI Software Architecture Agent | **Institutional Administrative Operations Agent** | `administration` | `SUPPORT` | `get_student_status, create_task...` | administrative-request |
| `agent-063` | AI Codebase Analysis Agent | **Institutional Administrative Operations Agent** | `administration` | `SUPPORT` | `get_student_status, create_task...` | administrative-request |
| `agent-064` | AI Bug Hunting Agent | **Institutional Administrative Operations Agent** | `administration` | `SUPPORT` | `get_student_status, create_task...` | administrative-request |
| `agent-065` | AI Performance Optimization Agent | **Institutional Administrative Operations Agent** | `administration` | `SUPPORT` | `get_student_status, create_task...` | administrative-request |
| `agent-066` | AI Security Audit Agent | **Institutional Administrative Operations Agent** | `administration` | `SUPPORT` | `get_student_status, create_task...` | administrative-request |
| `agent-067` | AI Test Engineer Agent | **Academic Performance & Course Records Agent** | `academic` | `DIRECT_REUSE` | `get_attendance, get_marks...` | attendance-intervention, graduation-clearance |
| `agent-068` | AI Dependency Analysis Agent | **Institutional Administrative Operations Agent** | `administration` | `SUPPORT` | `get_student_status, create_task...` | administrative-request |
| `agent-069` | AI API Documentation Agent | **Institutional Administrative Operations Agent** | `administration` | `SUPPORT` | `get_student_status, create_task...` | administrative-request |
| `agent-070` | AI Code Refactoring Agent | **Institutional Administrative Operations Agent** | `administration` | `SUPPORT` | `get_student_status, create_task...` | administrative-request |
| `agent-071` | AI Database Agent | **Institutional Data Gateway & Persistence Agent** | `workflow-intelligence` | `ORCHESTRATION` | `get_student_profile, get_courses...` | admission-verification, scholarship-eligibility, course-override, graduation-clearance |
| `agent-072` | AI DevOps Agent | **Automated Workflow Pipeline & Task Handler Agent** | `workflow-intelligence` | `ORCHESTRATION` | `create_task, update_task...` | administrative-request |
| `agent-073` | AI Docker Agent | **Automated Workflow Pipeline & Task Handler Agent** | `workflow-intelligence` | `ORCHESTRATION` | `create_task, update_task...` | administrative-request |
| `agent-074` | AI CI/CD Agent | **Automated Workflow Pipeline & Task Handler Agent** | `workflow-intelligence` | `ORCHESTRATION` | `create_task, update_task...` | administrative-request |
| `agent-075` | AI Full-Stack Developer Agent | **Automated Workflow Pipeline & Task Handler Agent** | `workflow-intelligence` | `ORCHESTRATION` | `create_task, update_task...` | administrative-request |
| `agent-076` | AI Sales Agent | **Admission Application Intake & Merit Evaluation Agent** | `admission` | `REPURPOSE` | `get_admission_application, calculate_merit...` | admission-verification |
| `agent-077` | AI Lead Generation Agent | **Admission Application Intake & Merit Evaluation Agent** | `admission` | `REPURPOSE` | `get_admission_application, calculate_merit...` | admission-verification |
| `agent-078` | AI Lead Qualification Agent | **Student Support & Inquiries Agent** | `student-services` | `REPURPOSE` | `get_student_profile, get_student_status...` | student-service |
| `agent-079` | AI Customer Support Agent | **Institutional Administrative Operations Agent** | `administration` | `SUPPORT` | `get_student_status, create_task...` | administrative-request |
| `agent-080` | AI Marketing Agent | **Campus Announcement & Student Engagement Agent** | `communication` | `DIRECT_REUSE` | `send_notification, create_reminder...` | attendance-intervention, student-service |
| `agent-081` | AI Social Media Agent | **Campus Announcement & Student Engagement Agent** | `communication` | `DIRECT_REUSE` | `send_notification, create_reminder...` | attendance-intervention, student-service |
| `agent-082` | AI SEO Agent | **Institutional Operations Intelligence & Assessment Agent** | `analytics` | `DIRECT_REUSE` | `get_attendance, get_fee_status...` | attendance-intervention, administrative-request |
| `agent-083` | AI Content Marketing Agent | **Campus Announcement & Student Engagement Agent** | `communication` | `DIRECT_REUSE` | `send_notification, create_reminder...` | attendance-intervention, student-service |
| `agent-084` | AI Business Analyst Agent | **Institutional Operations Intelligence & Assessment Agent** | `analytics` | `DIRECT_REUSE` | `get_attendance, get_fee_status...` | attendance-intervention, administrative-request |
| `agent-085` | AI Financial Analysis Agent | **Scholarship & Financial Aid Eligibility Evaluator Agent** | `finance` | `DIRECT_REUSE` | `get_fee_status, get_scholarship_rules...` | scholarship-eligibility |
| `agent-086` | AI Accounting Assistant Agent | **Institutional Accounting & Ledger Balance Agent** | `finance` | `DIRECT_REUSE` | `get_fee_status, get_payment_history...` | scholarship-eligibility, graduation-clearance |
| `agent-087` | AI E-Commerce Agent | **Institutional Accounting & Ledger Balance Agent** | `finance` | `DIRECT_REUSE` | `get_fee_status, get_payment_history...` | scholarship-eligibility, graduation-clearance |
| `agent-088` | AI Supply Chain Agent | **Institutional Accounting & Ledger Balance Agent** | `finance` | `DIRECT_REUSE` | `get_fee_status, get_payment_history...` | scholarship-eligibility, graduation-clearance |
| `agent-089` | AI HR & Recruitment Agent | **Faculty Affairs & Departmental Committee HR Agent** | `faculty-hr` | `REPURPOSE` | `get_faculty_profile, get_workload...` | course-override, scholarship-eligibility |
| `agent-090` | AI Project Manager Agent | **Institutional Operations & Faculty Process Agent** | `faculty-hr` | `REPURPOSE` | `get_faculty_profile, create_task...` | attendance-intervention |
| `agent-091` | AI Autonomous Research Agent | **Automated Workflow Pipeline & Task Handler Agent** | `workflow-intelligence` | `ORCHESTRATION` | `create_task, update_task...` | administrative-request |
| `agent-092` | AI Browser Automation Agent | **Automated Workflow Pipeline & Task Handler Agent** | `workflow-intelligence` | `ORCHESTRATION` | `create_task, update_task...` | administrative-request |
| `agent-093` | AI RAG Knowledge Agent | **Document Intelligence & Knowledge Extraction Agent** | `document-intelligence` | `DIRECT_REUSE` | `get_document, extract_document_data...` | admission-verification, scholarship-eligibility |
| `agent-094` | AI Multi-Agent Debate Agent | **Automated Workflow Pipeline & Task Handler Agent** | `workflow-intelligence` | `ORCHESTRATION` | `create_task, update_task...` | administrative-request |
| `agent-095` | AI Business Operations Agent | **Automated Workflow Pipeline & Task Handler Agent** | `workflow-intelligence` | `ORCHESTRATION` | `create_task, update_task...` | administrative-request |
| `agent-096` | AI Autonomous Coding Agent | **Automated Workflow Pipeline & Task Handler Agent** | `workflow-intelligence` | `ORCHESTRATION` | `create_task, update_task...` | administrative-request |
| `agent-097` | AI AI-Research Scientist Agent | **Institutional Operations Intelligence & Assessment Agent** | `analytics` | `DIRECT_REUSE` | `get_attendance, get_fee_status...` | attendance-intervention, administrative-request |
| `agent-098` | AI Startup Builder Agent | **Admission Program Onboarding Agent** | `admission` | `REPURPOSE` | `get_admission_application, record_agent_action` | admission-verification |
| `agent-099` | AI Multi-Agent Coordinator Agent | **Multi-Agent Consensus & Evidence Aggregator Agent** | `workflow-intelligence` | `ORCHESTRATION` | `record_decision, record_agent_action...` | scholarship-eligibility, graduation-clearance |
| `agent-100` | AI Agent Orchestrator Agent | **Sub-Workflow Orchestration & Task Execution Agent** | `workflow-intelligence` | `ORCHESTRATION` | `create_task, update_task...` | admission-verification, scholarship-eligibility, attendance-intervention, course-override, graduation-clearance |
| `agent-101` | AI Master Agent | **Educational Master Workflow Orchestrator** | `master-orchestration` | `ORCHESTRATION` | `*` | admission-verification, scholarship-eligibility, attendance-intervention, course-override, graduation-clearance |
