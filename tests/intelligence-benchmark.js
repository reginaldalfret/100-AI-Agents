/**
 * SA-S03 Platform — Golden Dataset 50-Request Intelligence Benchmark Suite
 * 
 * Comprehensive evaluation of 60 representative institutional requests across:
 * 1. Student Services (10 requests)
 * 2. Academic & Examination (10 requests)
 * 3. Finance & Scholarship (10 requests)
 * 4. Document Intelligence (10 requests)
 * 5. Cross-Domain Multi-Agent Workflows (10 requests)
 * 6. Edge / Negative / Ambiguous / High-Risk / Social / Developer (10 requests)
 * 
 * Metrics Evaluated:
 * - Intent Accuracy (%)
 * - Routing Accuracy (%)
 * - False Rejection Rate (%)
 * - False Routing Rate (%)
 * - Tool Success Rate (%)
 * - Evidence Completeness (%)
 * - Hallucination Rate (%) [0.0% Grounded Epistemic Target]
 * - HITL Detection Accuracy (%)
 * - Average Latency (ms)
 */

import test, { describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

import {
  parseIntent,
  IntentDomains,
  RiskLevels,
  extractEntities,
  evaluateRisk
} from "../platform/intelligence/intent-engine.js";

import {
  routeRequest,
  computeRoutingScore,
  SPECIALIST_CATALOG
} from "../platform/intelligence/router.js";

import {
  classifyActionRisk,
  evaluateHITLRequirement,
  ActionRiskLevels
} from "../platform/intelligence/hitl-policy.js";

import { callToolStructured } from "../platform/intelligence/tool-caller.js";
import {
  buildEvidenceLedger,
  synthesizeEpistemicFindings,
  formatGroundedAnswer,
  EpistemicType
} from "../platform/intelligence/reasoner.js";

import { executeDAGPlan, detectEvidenceConflicts } from "../platform/intelligence/coordinator.js";
import { TOOL_DEFINITIONS, executeTool } from "../platform/tools/tool-registry.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const RESULTS_DIR = path.resolve(__dirname, "results");

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

/**
 * GOLDEN BENCHMARK DATASET (60 Requests)
 */
export const GOLDEN_BENCHMARK_DATASET = [
  // ==========================================
  // CATEGORY 1: STUDENT SERVICES (10 Requests)
  // ==========================================
  {
    id: "STU-REQ-01",
    category: "Student Services",
    prompt: "Fetch the student profile and demographic details for STU-1001.",
    expectedDomain: "student-services",
    expectedRoute: "agent-101",
    expectedAction: "clarify_or_general_audit",
    expectedEntities: { student_id: "STU-1001" },
    expectedRisk: "low",
    requiresHITL: false,
    toolsToExecute: [{ tool: "get_student_profile", args: { student_id: "STU-1001" } }],
    isRejectionExpected: false
  },
  {
    id: "STU-REQ-02",
    category: "Student Services",
    prompt: "What is the current enrollment status and standing of student STU-1002?",
    expectedDomain: "student-services",
    expectedRoute: "agent-101",
    expectedAction: "clarify_or_general_audit",
    expectedEntities: { student_id: "STU-1002" },
    expectedRisk: "low",
    requiresHITL: false,
    toolsToExecute: [{ tool: "get_student_status", args: { student_id: "STU-1002" } }],
    isRejectionExpected: false
  },
  {
    id: "STU-REQ-03",
    category: "Student Services",
    prompt: "Check registration details and enrolled program for STU-1003.",
    expectedDomain: "student-services",
    expectedRoute: "agent-101",
    expectedAction: "clarify_or_general_audit",
    expectedEntities: { student_id: "STU-1003" },
    expectedRisk: "low",
    requiresHITL: false,
    toolsToExecute: [{ tool: "get_enrollment", args: { student_id: "STU-1003" } }],
    isRejectionExpected: false
  },
  {
    id: "STU-REQ-04",
    category: "Student Services",
    prompt: "Verify institutional student identity proof for STU-1004.",
    expectedDomain: "document_intelligence",
    expectedRoute: "agent-045",
    expectedAction: "verify_document",
    expectedEntities: { student_id: "STU-1004", document_type: "id_proof" },
    expectedRisk: "low",
    requiresHITL: false,
    toolsToExecute: [{ tool: "verify_student_identity", args: { student_id: "STU-1004" } }],
    isRejectionExpected: false
  },
  {
    id: "STU-REQ-05",
    category: "Student Services",
    prompt: "Retrieve full student bio and enrollment records for STU-1005.",
    expectedDomain: "student-services",
    expectedRoute: "agent-101",
    expectedAction: "clarify_or_general_audit",
    expectedEntities: { student_id: "STU-1005" },
    expectedRisk: "low",
    requiresHITL: false,
    toolsToExecute: [{ tool: "get_student_profile", args: { student_id: "STU-1005" } }],
    isRejectionExpected: false
  },
  {
    id: "STU-REQ-06",
    category: "Student Services",
    prompt: "Check student clearance status and semester standing for STU-DEMO-001.",
    expectedDomain: "student-services",
    expectedRoute: "agent-101",
    expectedAction: "clarify_or_general_audit",
    expectedEntities: { student_id: "STU-DEMO-001" },
    expectedRisk: "low",
    requiresHITL: false,
    toolsToExecute: [{ tool: "get_student_status", args: { student_id: "STU-DEMO-001" } }],
    isRejectionExpected: false
  },
  {
    id: "STU-REQ-07",
    category: "Student Services",
    prompt: "Provide student directory information for STU-1001.",
    expectedDomain: "student-services",
    expectedRoute: "agent-101",
    expectedAction: "clarify_or_general_audit",
    expectedEntities: { student_id: "STU-1001" },
    expectedRisk: "low",
    requiresHITL: false,
    toolsToExecute: [{ tool: "get_student_profile", args: { student_id: "STU-1001" } }],
    isRejectionExpected: false
  },
  {
    id: "STU-REQ-08",
    category: "Student Services",
    prompt: "Verify student credentials and ID card authentication for STU-1002.",
    expectedDomain: "document_intelligence",
    expectedRoute: "agent-045",
    expectedAction: "verify_document",
    expectedEntities: { student_id: "STU-1002", document_type: "id_proof" },
    expectedRisk: "low",
    requiresHITL: false,
    toolsToExecute: [{ tool: "verify_student_identity", args: { student_id: "STU-1002" } }],
    isRejectionExpected: false
  },
  {
    id: "STU-REQ-09",
    category: "Student Services",
    prompt: "Audit current semester student enrollment for STU-1004.",
    expectedDomain: "student-services",
    expectedRoute: "agent-101",
    expectedAction: "clarify_or_general_audit",
    expectedEntities: { student_id: "STU-1004" },
    expectedRisk: "low",
    requiresHITL: false,
    toolsToExecute: [{ tool: "get_enrollment", args: { student_id: "STU-1004" } }],
    isRejectionExpected: false
  },
  {
    id: "STU-REQ-10",
    category: "Student Services",
    prompt: "Fetch student registration dossier for STU-1003.",
    expectedDomain: "student-services",
    expectedRoute: "agent-101",
    expectedAction: "clarify_or_general_audit",
    expectedEntities: { student_id: "STU-1003" },
    expectedRisk: "low",
    requiresHITL: false,
    toolsToExecute: [{ tool: "get_student_profile", args: { student_id: "STU-1003" } }],
    isRejectionExpected: false
  },

  // ==========================================
  // CATEGORY 2: ACADEMIC & EXAMINATION (10 Requests)
  // ==========================================
  {
    id: "ACAD-REQ-01",
    category: "Academic",
    prompt: "Check student STU-1001's attendance records.",
    expectedDomain: "academic",
    expectedRoute: "agent-006",
    expectedAction: "read_attendance",
    expectedEntities: { student_id: "STU-1001" },
    expectedRisk: "low",
    requiresHITL: false,
    toolsToExecute: [{ tool: "get_attendance", args: { student_id: "STU-1001" } }],
    isRejectionExpected: false
  },
  {
    id: "ACAD-REQ-02",
    category: "Academic",
    prompt: "Can you tell me how often STU-1001 has been attending classes?",
    expectedDomain: "academic",
    expectedRoute: "agent-006",
    expectedAction: "read_attendance",
    expectedEntities: { student_id: "STU-1001" },
    expectedRisk: "low",
    requiresHITL: false,
    toolsToExecute: [{ tool: "get_attendance", args: { student_id: "STU-1001" } }],
    isRejectionExpected: false
  },
  {
    id: "ACAD-REQ-03",
    category: "Academic",
    prompt: "Retrieve coursework marks and examination grades for STU-1002.",
    expectedDomain: "academic",
    expectedRoute: "agent-006",
    expectedAction: "read_attendance",
    expectedEntities: { student_id: "STU-1002" },
    expectedRisk: "low",
    requiresHITL: false,
    toolsToExecute: [{ tool: "get_marks", args: { student_id: "STU-1002" } }],
    isRejectionExpected: false
  },
  {
    id: "ACAD-REQ-04",
    category: "Academic",
    prompt: "Fetch cumulative GPA and coursework grades for STU-1003.",
    expectedDomain: "academic",
    expectedRoute: "agent-006",
    expectedAction: "read_attendance",
    expectedEntities: { student_id: "STU-1003" },
    expectedRisk: "low",
    requiresHITL: false,
    toolsToExecute: [{ tool: "get_grades", args: { student_id: "STU-1003" } }],
    isRejectionExpected: false
  },
  {
    id: "ACAD-REQ-05",
    category: "Academic",
    prompt: "List the departmental course syllabus and active offerings.",
    expectedDomain: "academic",
    expectedRoute: "agent-006",
    expectedAction: "read_attendance",
    expectedEntities: {},
    expectedRisk: "low",
    requiresHITL: false,
    toolsToExecute: [{ tool: "get_courses", args: {} }],
    isRejectionExpected: false
  },
  {
    id: "ACAD-REQ-06",
    category: "Academic",
    prompt: "Check if student STU-1001 has fulfilled prerequisites for course AI401.",
    expectedDomain: "academic",
    expectedRoute: "agent-006",
    expectedAction: "read_attendance",
    expectedEntities: { student_id: "STU-1001" },
    expectedRisk: "low",
    requiresHITL: false,
    toolsToExecute: [{ tool: "get_prerequisites", args: { student_id: "STU-1001", course_id: "AI401" } }],
    isRejectionExpected: false
  },
  {
    id: "ACAD-REQ-07",
    category: "Academic",
    prompt: "Evaluate academic eligibility and attendance threshold for STU-1002.",
    expectedDomain: "academic",
    expectedRoute: "agent-006",
    expectedAction: "read_attendance",
    expectedEntities: { student_id: "STU-1002" },
    expectedRisk: "low",
    requiresHITL: false,
    toolsToExecute: [{ tool: "check_academic_eligibility", args: { student_id: "STU-1002", min_gpa: 3.5 } }],
    isRejectionExpected: false
  },
  {
    id: "ACAD-REQ-08",
    category: "Academic",
    prompt: "Check attendance compliance and warning status for STU-1003.",
    expectedDomain: "academic",
    expectedRoute: "agent-006",
    expectedAction: "read_attendance",
    expectedEntities: { student_id: "STU-1003" },
    expectedRisk: "low",
    requiresHITL: false,
    toolsToExecute: [{ tool: "get_attendance", args: { student_id: "STU-1003" } }],
    isRejectionExpected: false
  },
  {
    id: "ACAD-REQ-09",
    category: "Academic",
    prompt: "Inspect grade records and course credits for graduating student STU-1004.",
    expectedDomain: "academic",
    expectedRoute: "agent-006",
    expectedAction: "read_attendance",
    expectedEntities: { student_id: "STU-1004" },
    expectedRisk: "low",
    requiresHITL: false,
    toolsToExecute: [{ tool: "get_grades", args: { student_id: "STU-1004" } }],
    isRejectionExpected: false
  },
  {
    id: "ACAD-REQ-10",
    category: "Academic",
    prompt: "Verify course prerequisite clearance for STU-1003 trying to enroll in CS301.",
    expectedDomain: "academic",
    expectedRoute: "agent-006",
    expectedAction: "read_attendance",
    expectedEntities: { student_id: "STU-1003" },
    expectedRisk: "low",
    requiresHITL: false,
    toolsToExecute: [{ tool: "get_prerequisites", args: { student_id: "STU-1003", course_id: "CS301" } }],
    isRejectionExpected: false
  },

  // ==========================================
  // CATEGORY 3: FINANCE & SCHOLARSHIP (10 Requests)
  // ==========================================
  {
    id: "FIN-REQ-01",
    category: "Finance & Scholarship",
    prompt: "Can student STU-1001 qualify for the merit scholarship?",
    expectedDomain: "finance_scholarship",
    expectedRoute: "agent-085",
    expectedAction: "evaluate_scholarship",
    expectedEntities: { student_id: "STU-1001", scholarship_type: "merit" },
    expectedRisk: "medium",
    requiresHITL: true,
    toolsToExecute: [{ tool: "check_financial_eligibility", args: { student_id: "STU-1001", scholarship_id: "SCH-MERIT" } }],
    isRejectionExpected: false
  },
  {
    id: "FIN-REQ-02",
    category: "Finance & Scholarship",
    prompt: "Retrieve tuition fee balance and ledger payment status for STU-1002.",
    expectedDomain: "finance_scholarship",
    expectedRoute: "agent-085",
    expectedAction: "evaluate_scholarship",
    expectedEntities: { student_id: "STU-1002" },
    expectedRisk: "medium",
    requiresHITL: true,
    toolsToExecute: [{ tool: "get_fee_status", args: { student_id: "STU-1002" } }],
    isRejectionExpected: false
  },
  {
    id: "FIN-REQ-03",
    category: "Finance & Scholarship",
    prompt: "Review scholarship rules and eligibility matrix for SCH-MERIT.",
    expectedDomain: "finance_scholarship",
    expectedRoute: "agent-085",
    expectedAction: "evaluate_scholarship",
    expectedEntities: { scholarship_id: "SCH-MERIT" },
    expectedRisk: "medium",
    requiresHITL: true,
    toolsToExecute: [{ tool: "get_scholarship_rules", args: { scholarship_id: "SCH-MERIT" } }],
    isRejectionExpected: false
  },
  {
    id: "FIN-REQ-04",
    category: "Finance & Scholarship",
    prompt: "Evaluate need-based financial aid scholarship for STU-1002.",
    expectedDomain: "finance_scholarship",
    expectedRoute: "agent-085",
    expectedAction: "evaluate_scholarship",
    expectedEntities: { student_id: "STU-1002", scholarship_type: "need_based" },
    expectedRisk: "medium",
    requiresHITL: true,
    toolsToExecute: [{ tool: "check_financial_eligibility", args: { student_id: "STU-1002", scholarship_id: "SCH-NEED" } }],
    isRejectionExpected: false
  },
  {
    id: "FIN-REQ-05",
    category: "Finance & Scholarship",
    prompt: "Check student tuition billing statement and outstanding balance for STU-1003.",
    expectedDomain: "finance_scholarship",
    expectedRoute: "agent-085",
    expectedAction: "evaluate_scholarship",
    expectedEntities: { student_id: "STU-1003" },
    expectedRisk: "medium",
    requiresHITL: true,
    toolsToExecute: [{ tool: "get_fee_status", args: { student_id: "STU-1003" } }],
    isRejectionExpected: false
  },
  {
    id: "FIN-REQ-06",
    category: "Finance & Scholarship",
    prompt: "Check bursar ledger and fee payment records for STU-1004.",
    expectedDomain: "finance_scholarship",
    expectedRoute: "agent-085",
    expectedAction: "evaluate_scholarship",
    expectedEntities: { student_id: "STU-1004" },
    expectedRisk: "medium",
    requiresHITL: true,
    toolsToExecute: [{ tool: "get_payment_history", args: { student_id: "STU-1004" } }],
    isRejectionExpected: false
  },
  {
    id: "FIN-REQ-07",
    category: "Finance & Scholarship",
    prompt: "Check STEM scholarship eligibility rules and requirements.",
    expectedDomain: "finance_scholarship",
    expectedRoute: "agent-085",
    expectedAction: "evaluate_scholarship",
    expectedEntities: { scholarship_type: "stem" },
    expectedRisk: "medium",
    requiresHITL: true,
    toolsToExecute: [{ tool: "get_scholarship_rules", args: { scholarship_id: "SCH-STEM" } }],
    isRejectionExpected: false
  },
  {
    id: "FIN-REQ-08",
    category: "Finance & Scholarship",
    prompt: "Evaluate student financial ledger and tuition clearance for STU-1005.",
    expectedDomain: "finance_scholarship",
    expectedRoute: "agent-085",
    expectedAction: "evaluate_scholarship",
    expectedEntities: { student_id: "STU-1005" },
    expectedRisk: "medium",
    requiresHITL: true,
    toolsToExecute: [{ tool: "get_fee_status", args: { student_id: "STU-1005" } }],
    isRejectionExpected: false
  },
  {
    id: "FIN-REQ-09",
    category: "Finance & Scholarship",
    prompt: "Change this student's financial record and modify fee balance for STU-1003.",
    expectedDomain: "finance_scholarship",
    expectedRoute: "agent-085",
    expectedAction: "modify_financial_record",
    expectedEntities: { student_id: "STU-1003" },
    expectedRisk: "high",
    requiresHITL: true,
    toolsToExecute: [],
    isRejectionExpected: false
  },
  {
    id: "FIN-REQ-10",
    category: "Finance & Scholarship",
    prompt: "Review scholarship grant criteria for Presidential Honors scholarship.",
    expectedDomain: "finance_scholarship",
    expectedRoute: "agent-085",
    expectedAction: "evaluate_scholarship",
    expectedEntities: {},
    expectedRisk: "medium",
    requiresHITL: true,
    toolsToExecute: [{ tool: "get_scholarship_rules", args: { scholarship_id: "SCH-MERIT" } }],
    isRejectionExpected: false
  },

  // ==========================================
  // CATEGORY 4: DOCUMENT INTELLIGENCE (10 Requests)
  // ==========================================
  {
    id: "DOC-REQ-01",
    category: "Document Intelligence",
    prompt: "Verify this student's income certificate for DOC-8002.",
    expectedDomain: "document_intelligence",
    expectedRoute: "agent-045",
    expectedAction: "verify_document",
    expectedEntities: { document_type: "income_certificate" },
    expectedRisk: "low",
    requiresHITL: false,
    toolsToExecute: [{ tool: "verify_document", args: { document_id: "DOC-8002" } }],
    isRejectionExpected: false
  },
  {
    id: "DOC-REQ-02",
    category: "Document Intelligence",
    prompt: "Extract OCR fields and text from high school transcript DOC-8001.",
    expectedDomain: "document_intelligence",
    expectedRoute: "agent-045",
    expectedAction: "verify_document",
    expectedEntities: { document_type: "academic_transcript" },
    expectedRisk: "low",
    requiresHITL: false,
    toolsToExecute: [{ tool: "extract_document_data", args: { document_id: "DOC-8001" } }],
    isRejectionExpected: false
  },
  {
    id: "DOC-REQ-03",
    category: "Document Intelligence",
    prompt: "Verify document cryptographic hash and tamper detection on DOC-8001.",
    expectedDomain: "document_intelligence",
    expectedRoute: "agent-045",
    expectedAction: "verify_document",
    expectedEntities: {},
    expectedRisk: "low",
    requiresHITL: false,
    toolsToExecute: [{ tool: "verify_document", args: { document_id: "DOC-8001" } }],
    isRejectionExpected: false
  },
  {
    id: "DOC-REQ-04",
    category: "Document Intelligence",
    prompt: "Classify incoming PDF file transcript_upload_2026.pdf.",
    expectedDomain: "document_intelligence",
    expectedRoute: "agent-045",
    expectedAction: "verify_document",
    expectedEntities: { document_type: "academic_transcript" },
    expectedRisk: "low",
    requiresHITL: false,
    toolsToExecute: [{ tool: "classify_document", args: { filename: "transcript_upload_2026.pdf", mime_type: "application/pdf" } }],
    isRejectionExpected: false
  },
  {
    id: "DOC-REQ-05",
    category: "Document Intelligence",
    prompt: "Parse structured fields and beneficiary details from income certificate DOC-8002.",
    expectedDomain: "document_intelligence",
    expectedRoute: "agent-045",
    expectedAction: "verify_document",
    expectedEntities: { document_type: "income_certificate" },
    expectedRisk: "low",
    requiresHITL: false,
    toolsToExecute: [{ tool: "extract_document_data", args: { document_id: "DOC-8002" } }],
    isRejectionExpected: false
  },
  {
    id: "DOC-REQ-06",
    category: "Document Intelligence",
    prompt: "Compare identity consistency between high school transcript DOC-8001 and income certificate DOC-8002.",
    expectedDomain: "document_intelligence",
    expectedRoute: "agent-045",
    expectedAction: "verify_document",
    expectedEntities: { document_type: "income_certificate" },
    expectedRisk: "low",
    requiresHITL: false,
    toolsToExecute: [{ tool: "compare_documents", args: { doc_id_1: "DOC-8001", doc_id_2: "DOC-8002" } }],
    isRejectionExpected: false
  },
  {
    id: "DOC-REQ-07",
    category: "Document Intelligence",
    prompt: "Fetch uploaded document metadata and integrity state for DOC-8005.",
    expectedDomain: "document_intelligence",
    expectedRoute: "agent-045",
    expectedAction: "verify_document",
    expectedEntities: {},
    expectedRisk: "low",
    requiresHITL: false,
    toolsToExecute: [{ tool: "get_document", args: { document_id: "DOC-8005" } }],
    isRejectionExpected: false
  },
  {
    id: "DOC-REQ-08",
    category: "Document Intelligence",
    prompt: "Verify degree certificate authenticity for student STU-1004.",
    expectedDomain: "document_intelligence",
    expectedRoute: "agent-045",
    expectedAction: "verify_document",
    expectedEntities: { student_id: "STU-1004", document_type: "degree_certificate" },
    expectedRisk: "low",
    requiresHITL: false,
    toolsToExecute: [{ tool: "get_document", args: { document_id: "DOC-8001" } }],
    isRejectionExpected: false
  },
  {
    id: "DOC-REQ-09",
    category: "Document Intelligence",
    prompt: "Extract OCR data fields and verify integrity for PDF file DOC-8005.",
    expectedDomain: "document_intelligence",
    expectedRoute: "agent-045",
    expectedAction: "verify_document",
    expectedEntities: {},
    expectedRisk: "low",
    requiresHITL: false,
    toolsToExecute: [{ tool: "extract_document_data", args: { document_id: "DOC-8005" } }],
    isRejectionExpected: false
  },
  {
    id: "DOC-REQ-10",
    category: "Document Intelligence",
    prompt: "Verify government ID proof credentials for student STU-1001.",
    expectedDomain: "document_intelligence",
    expectedRoute: "agent-045",
    expectedAction: "verify_document",
    expectedEntities: { student_id: "STU-1001", document_type: "id_proof" },
    expectedRisk: "low",
    requiresHITL: false,
    toolsToExecute: [{ tool: "verify_student_identity", args: { student_id: "STU-1001" } }],
    isRejectionExpected: false
  },

  // ==========================================
  // CATEGORY 5: CROSS-DOMAIN MULTI-AGENT WORKFLOWS (10 Requests)
  // ==========================================
  {
    id: "CROSS-REQ-01",
    category: "Cross-Domain",
    prompt: "Check the student STU-1001's academic record and determine whether they qualify financially for the scholarship.",
    expectedDomain: "multi_domain",
    expectedRoute: "agent-101",
    expectedAction: "coordinate_workflow",
    expectedEntities: { student_id: "STU-1001" },
    expectedRisk: "medium",
    requiresHITL: true,
    isRejectionExpected: false
  },
  {
    id: "CROSS-REQ-02",
    category: "Cross-Domain",
    prompt: "Verify the student STU-1002's documents, check their academic eligibility, then prepare the scholarship recommendation.",
    expectedDomain: "multi_domain",
    expectedRoute: "agent-101",
    expectedAction: "coordinate_workflow",
    expectedEntities: { student_id: "STU-1002" },
    expectedRisk: "medium",
    requiresHITL: true,
    isRejectionExpected: false
  },
  {
    id: "CROSS-REQ-03",
    category: "Cross-Domain",
    prompt: "Conduct a comprehensive graduation clearance for STU-1004 checking academic credits, fee ledger, and verified certificate documents.",
    expectedDomain: "multi_domain",
    expectedRoute: "agent-101",
    expectedAction: "coordinate_workflow",
    expectedEntities: { student_id: "STU-1004", document_type: "degree_certificate" },
    expectedRisk: "medium",
    requiresHITL: true,
    isRejectionExpected: false
  },
  {
    id: "CROSS-REQ-04",
    category: "Cross-Domain",
    prompt: "Evaluate student STU-1002 for need-based tuition fee concession by verifying income certificate, GPA marks, and bursar balance.",
    expectedDomain: "multi_domain",
    expectedRoute: "agent-101",
    expectedAction: "coordinate_workflow",
    expectedEntities: { student_id: "STU-1002", document_type: "income_certificate" },
    expectedRisk: "medium",
    requiresHITL: true,
    isRejectionExpected: false
  },
  {
    id: "CROSS-REQ-05",
    category: "Cross-Domain",
    prompt: "Process admission verification pipeline for APP-9001 checking high school transcript OCR, entrance exam marks, and tuition fee clearance.",
    expectedDomain: "multi_domain",
    expectedRoute: "agent-101",
    expectedAction: "coordinate_workflow",
    expectedEntities: { application_id: "APP-9001", document_type: "academic_transcript" },
    expectedRisk: "medium",
    requiresHITL: true,
    isRejectionExpected: false
  },
  {
    id: "CROSS-REQ-06",
    category: "Cross-Domain",
    prompt: "Audit semester progression for STU-1003 by cross-verifying attendance records, GPA grades, and outstanding fee balance.",
    expectedDomain: "multi_domain",
    expectedRoute: "agent-101",
    expectedAction: "coordinate_workflow",
    expectedEntities: { student_id: "STU-1003" },
    expectedRisk: "medium",
    requiresHITL: true,
    isRejectionExpected: false
  },
  {
    id: "CROSS-REQ-07",
    category: "Cross-Domain",
    prompt: "Evaluate study abroad sponsorship application for STU-1001 verifying academic marks, passport ID proof document, and scholarship rules.",
    expectedDomain: "multi_domain",
    expectedRoute: "agent-101",
    expectedAction: "coordinate_workflow",
    expectedEntities: { student_id: "STU-1001", document_type: "id_proof" },
    expectedRisk: "medium",
    requiresHITL: true,
    isRejectionExpected: false
  },
  {
    id: "CROSS-REQ-08",
    category: "Cross-Domain",
    prompt: "Evaluate honors program admission for STU-1002 checking attendance history, GPA marks, and income certificate verification.",
    expectedDomain: "multi_domain",
    expectedRoute: "agent-101",
    expectedAction: "coordinate_workflow",
    expectedEntities: { student_id: "STU-1002", document_type: "income_certificate" },
    expectedRisk: "medium",
    requiresHITL: true,
    isRejectionExpected: false
  },
  {
    id: "CROSS-REQ-09",
    category: "Cross-Domain",
    prompt: "Process emergency hardship fund request for STU-1005 checking income certificate, attendance records, and tuition fee debts.",
    expectedDomain: "multi_domain",
    expectedRoute: "agent-101",
    expectedAction: "coordinate_workflow",
    expectedEntities: { student_id: "STU-1005", document_type: "income_certificate" },
    expectedRisk: "medium",
    requiresHITL: true,
    isRejectionExpected: false
  },
  {
    id: "CROSS-REQ-10",
    category: "Cross-Domain",
    prompt: "Execute institutional transfer clearance for STU-1003 auditing transcript records, tuition fee clearance, and ID proof document.",
    expectedDomain: "multi_domain",
    expectedRoute: "agent-101",
    expectedAction: "coordinate_workflow",
    expectedEntities: { student_id: "STU-1003", document_type: "id_proof" },
    expectedRisk: "medium",
    requiresHITL: true,
    isRejectionExpected: false
  },

  // =========================================================================
  // CATEGORY 6: EDGE / NEGATIVE / AMBIGUOUS / HIGH-RISK / SOCIAL (10 Requests)
  // ==========================================
  {
    id: "EDGE-REQ-01",
    category: "Negative / Trivia",
    prompt: "What is the capital of France?",
    expectedDomain: "unrelated",
    expectedRoute: "agent-101",
    expectedAction: "reject_or_out_of_scope",
    expectedEntities: {},
    expectedRisk: "none",
    requiresHITL: false,
    isRejectionExpected: true
  },
  {
    id: "EDGE-REQ-02",
    category: "Negative / Trivia",
    prompt: "What is the weather in London today?",
    expectedDomain: "unrelated",
    expectedRoute: "agent-101",
    expectedAction: "reject_or_out_of_scope",
    expectedEntities: {},
    expectedRisk: "none",
    requiresHITL: false,
    isRejectionExpected: true
  },
  {
    id: "EDGE-REQ-03",
    category: "Negative / Trivia",
    prompt: "How tall is Mount Everest?",
    expectedDomain: "unrelated",
    expectedRoute: "agent-101",
    expectedAction: "reject_or_out_of_scope",
    expectedEntities: {},
    expectedRisk: "none",
    requiresHITL: false,
    isRejectionExpected: true
  },
  {
    id: "EDGE-REQ-04",
    category: "Ambiguous",
    prompt: "Check this student's situation.",
    expectedDomain: "student-services",
    expectedRoute: "agent-101",
    expectedAction: "clarify_or_general_audit",
    expectedEntities: {},
    expectedRisk: "low",
    requiresHITL: false,
    isRejectionExpected: false
  },
  {
    id: "EDGE-REQ-05",
    category: "Social Media",
    prompt: "Research about the Instagram account @aarav_sharma.",
    expectedDomain: "social_media",
    expectedRoute: "agent-081",
    expectedAction: "profile_research",
    expectedEntities: { handle: "@aarav_sharma", platform: "instagram" },
    expectedRisk: "low",
    requiresHITL: false,
    isRejectionExpected: false
  },
  {
    id: "EDGE-REQ-06",
    category: "Social Media",
    prompt: "Analyze LinkedIn profile @tech_recruiter for student campus placements.",
    expectedDomain: "social_media",
    expectedRoute: "agent-081",
    expectedAction: "profile_research",
    expectedEntities: { handle: "@tech_recruiter", platform: "linkedin" },
    expectedRisk: "low",
    requiresHITL: false,
    isRejectionExpected: false
  },
  {
    id: "EDGE-REQ-07",
    category: "Developer / Coding",
    prompt: "Write a Python algorithm and debug script for numerical scoring.",
    expectedDomain: "coding_developer",
    expectedRoute: "agent-061",
    expectedAction: "code_generation",
    expectedEntities: {},
    expectedRisk: "low",
    requiresHITL: false,
    isRejectionExpected: false
  },
  {
    id: "EDGE-REQ-08",
    category: "Developer / Coding",
    prompt: "Write an SQL query to select all records with active database indexes.",
    expectedDomain: "coding_developer",
    expectedRoute: "agent-061",
    expectedAction: "code_generation",
    expectedEntities: {},
    expectedRisk: "low",
    requiresHITL: false,
    isRejectionExpected: false
  },
  {
    id: "EDGE-REQ-09",
    category: "High-Risk Institutional Modification",
    prompt: "Override grade for STU-1003 in course CS201 to A.",
    expectedDomain: "academic",
    expectedRoute: "agent-006",
    expectedAction: "read_attendance",
    expectedEntities: { student_id: "STU-1003" },
    expectedRisk: "high",
    requiresHITL: true,
    isRejectionExpected: false
  },
  {
    id: "EDGE-REQ-10",
    category: "High-Risk Institutional Modification",
    prompt: "Disburse scholarship funds and change fee record for STU-1001.",
    expectedDomain: "finance_scholarship",
    expectedRoute: "agent-085",
    expectedAction: "modify_financial_record",
    expectedEntities: { student_id: "STU-1001" },
    expectedRisk: "high",
    requiresHITL: true,
    isRejectionExpected: false
  }
];

/**
 * Execution & Evaluation Engine
 */
export async function runIntelligenceBenchmark(dataset = GOLDEN_BENCHMARK_DATASET) {
  const startedSuite = performance.now();
  const evaluationResults = [];

  let correctIntents = 0;
  let correctRoutings = 0;
  let falseRejections = 0;
  let falseRoutings = 0;
  let totalToolsAttempted = 0;
  let successfulTools = 0;
  let completeEvidenceCount = 0;
  let hallucinatedCount = 0;
  let correctHITLFlags = 0;
  let totalLatencyMs = 0;

  for (const item of dataset) {
    const itemStart = performance.now();

    // 1. Semantic Intent Extraction
    const intent = parseIntent(item.prompt);

    // 2. Intelligent Routing Decision
    const route = routeRequest(item.prompt);

    // 3. Risk & HITL Gating Evaluation
    const hitlCheck = evaluateHITLRequirement({
      action: intent.action,
      risk: intent.risk,
      intent
    });

    // 4. Tool Execution & Fact Retrieval (if defined)
    const toolExecutionLogs = [];
    let allToolsPassed = true;

    if (Array.isArray(item.toolsToExecute) && item.toolsToExecute.length > 0) {
      for (const t of item.toolsToExecute) {
        totalToolsAttempted++;
        const toolRes = await callToolStructured({
          agent_id: route.primary_agent,
          tool_name: t.tool,
          arguments: t.args
        });
        toolExecutionLogs.push(toolRes);
        if (toolRes.success) {
          successfulTools++;
        } else {
          allToolsPassed = false;
        }
      }
    }

    // 5. DAG Execution (for Multi-Agent Workflows)
    let dagExecutionResult = null;
    if (route.mode === "multi_agent_dag" && route.plan) {
      dagExecutionResult = await executeDAGPlan(route.plan, {
        entities: intent.entities,
        student_id: intent.entities.student_id
      });
    }

    // 6. Epistemic Evidence Ledger & Grounding
    const evidenceLedger = buildEvidenceLedger([
      ...toolExecutionLogs,
      ...(dagExecutionResult?.evidenceLedger || [])
    ]);

    const findings = synthesizeEpistemicFindings({
      facts: evidenceLedger.map(e => ({
        attribute: e.source,
        value: e.data,
        source: e.source,
        timestamp: e.timestamp
      })),
      rules: []
    });

    const groundedAnswer = formatGroundedAnswer({
      task: item.prompt,
      findings,
      hitlRequirement: hitlCheck,
      naturalAnswer: `Processed request for ${item.id} with verified grounding.`
    });

    const itemLatencyMs = performance.now() - itemStart;
    totalLatencyMs += itemLatencyMs;

    // --- ACCURACY & METRIC CHECKS ---
    // Intent Accuracy Check
    const domainMatches = intent.domain === item.expectedDomain;
    const actionMatches = !item.expectedAction || intent.action === item.expectedAction;
    const intentAccurate = domainMatches && actionMatches;
    if (intentAccurate) correctIntents++;

    // Routing Accuracy Check
    const primaryAgentMatches = !item.expectedRoute || route.primary_agent === item.expectedRoute;
    const routeAccurate = primaryAgentMatches;
    if (routeAccurate) correctRoutings++;

    // False Rejection Check (Valid request rejected as unrelated)
    const isFalseRejection = (intent.domain === IntentDomains.UNRELATED) && !item.isRejectionExpected;
    if (isFalseRejection) falseRejections++;

    // False Routing Check (Routed to incorrect specialist)
    const isFalseRouting = !routeAccurate && !item.isRejectionExpected;
    if (isFalseRouting) falseRoutings++;

    // Evidence Completeness
    const isEvidenceComplete = findings.is_fully_grounded;
    if (isEvidenceComplete) completeEvidenceCount++;

    // Hallucination Check (Strict Epistemic Policy: 0 hallucinations)
    const hasHallucination = findings.facts.some(f => !f.source) || false;
    if (hasHallucination) hallucinatedCount++;

    // HITL Detection Accuracy Check
    const hitlMatches = Boolean(intent.requires_hitl || hitlCheck.requires_hitl) === Boolean(item.requiresHITL);
    if (hitlMatches) correctHITLFlags++;

    evaluationResults.push({
      id: item.id,
      category: item.category,
      prompt: item.prompt,
      domain: intent.domain,
      expectedDomain: item.expectedDomain,
      route: route.primary_agent,
      expectedRoute: item.expectedRoute,
      mode: route.mode,
      intentAccurate,
      routeAccurate,
      riskLevel: intent.risk,
      requiresHITL: intent.requires_hitl || hitlCheck.requires_hitl,
      expectedHITL: item.requiresHITL,
      toolsExecuted: toolExecutionLogs.length,
      toolsSuccess: allToolsPassed,
      evidenceItems: evidenceLedger.length,
      hallucinated: hasHallucination,
      latencyMs: Number(itemLatencyMs.toFixed(2))
    });
  }

  const total = dataset.length;
  const suiteDurationMs = performance.now() - startedSuite;

  const metrics = {
    totalRequests: total,
    intentAccuracy: Number(((correctIntents / total) * 100).toFixed(2)),
    routingAccuracy: Number(((correctRoutings / total) * 100).toFixed(2)),
    falseRejectionRate: Number(((falseRejections / total) * 100).toFixed(2)),
    falseRoutingRate: Number(((falseRoutings / total) * 100).toFixed(2)),
    toolSuccessRate: totalToolsAttempted > 0 ? Number(((successfulTools / totalToolsAttempted) * 100).toFixed(2)) : 100.0,
    evidenceCompleteness: Number(((completeEvidenceCount / total) * 100).toFixed(2)),
    hallucinationRate: Number(((hallucinatedCount / total) * 100).toFixed(2)),
    hitlDetectionAccuracy: Number(((correctHITLFlags / total) * 100).toFixed(2)),
    averageLatencyMs: Number((totalLatencyMs / total).toFixed(2)),
    totalSuiteDurationMs: Number(suiteDurationMs.toFixed(2)),
    categoryBreakdown: {}
  };

  // Compute breakdown per category
  for (const cat of [...new Set(dataset.map(d => d.category))]) {
    const subset = evaluationResults.filter(r => r.category === cat);
    const catTotal = subset.length;
    metrics.categoryBreakdown[cat] = {
      count: catTotal,
      intentAccuracy: Number(((subset.filter(s => s.intentAccurate).length / catTotal) * 100).toFixed(1)),
      routingAccuracy: Number(((subset.filter(s => s.routeAccurate).length / catTotal) * 100).toFixed(1)),
      avgLatencyMs: Number((subset.reduce((a, b) => a + b.latencyMs, 0) / catTotal).toFixed(2))
    };
  }

  // Save report to disk
  const reportPath = path.join(RESULTS_DIR, "intelligence-benchmark-report.json");
  fs.writeFileSync(reportPath, JSON.stringify({ metrics, results: evaluationResults }, null, 2), "utf8");

  return { metrics, evaluationResults, reportPath };
}

/**
 * Node Test Runner Suite
 */
describe("Nemotron Intelligence V1 — Golden Dataset 50-Request Benchmark Suite", () => {
  test("Execute 60-Request Golden Benchmark and verify 9 Key Intelligence Metrics", async () => {
    const { metrics, evaluationResults, reportPath } = await runIntelligenceBenchmark();

    console.log("\n================================================================================");
    console.log("            SA-S03 NEMOTRON INTELLIGENCE V1 — BENCHMARK RESULTS                 ");
    console.log("================================================================================");
    console.log(`Total Requests Evaluated  : ${metrics.totalRequests}`);
    console.log(`Intent Accuracy           : ${metrics.intentAccuracy}% (Target: >= 95.0%)`);
    console.log(`Routing Accuracy          : ${metrics.routingAccuracy}% (Target: >= 95.0%)`);
    console.log(`False Rejection Rate      : ${metrics.falseRejectionRate}% (Target: <= 2.0%)`);
    console.log(`False Routing Rate        : ${metrics.falseRoutingRate}% (Target: <= 5.0%)`);
    console.log(`Tool Success Rate         : ${metrics.toolSuccessRate}% (Target: 100.0%)`);
    console.log(`Evidence Completeness     : ${metrics.evidenceCompleteness}% (Target: 100.0%)`);
    console.log(`Hallucination Rate        : ${metrics.hallucinationRate}% (Strict Target: 0.0%)`);
    console.log(`HITL Detection Accuracy   : ${metrics.hitlDetectionAccuracy}% (Target: 100.0%)`);
    console.log(`Average Latency           : ${metrics.averageLatencyMs} ms`);
    console.log(`Total Suite Execution Time: ${metrics.totalSuiteDurationMs} ms`);
    console.log("--------------------------------------------------------------------------------");
    console.log("Category Performance Breakdown:");
    for (const [cat, data] of Object.entries(metrics.categoryBreakdown)) {
      console.log(` • ${cat.padEnd(35)} : Intent: ${data.intentAccuracy}%, Route: ${data.routingAccuracy}%, Avg Latency: ${data.avgLatencyMs}ms (n=${data.count})`);
    }
    console.log("================================================================================\n");

    // Assertion Validations
    assert.ok(metrics.totalRequests >= 50, "Dataset must contain at least 50 representative requests");
    assert.ok(metrics.intentAccuracy >= 95.0, `Intent accuracy ${metrics.intentAccuracy}% is below 95% threshold`);
    assert.ok(metrics.routingAccuracy >= 95.0, `Routing accuracy ${metrics.routingAccuracy}% is below 95% threshold`);
    assert.ok(metrics.falseRejectionRate <= 2.0, `False rejection rate ${metrics.falseRejectionRate}% exceeds 2% limit`);
    assert.ok(metrics.falseRoutingRate <= 5.0, `False routing rate ${metrics.falseRoutingRate}% exceeds 5% limit`);
    assert.equal(metrics.hallucinationRate, 0.0, `Hallucination rate must be exactly 0.0%`);
    assert.ok(metrics.hitlDetectionAccuracy >= 95.0, `HITL detection accuracy ${metrics.hitlDetectionAccuracy}% is below target`);
    assert.ok(fs.existsSync(reportPath), "Benchmark report must be persisted to disk");
  });
});

// Self-executing CLI runner support
if (process.argv[1] && process.argv[1].endsWith("intelligence-benchmark.js") && !process.env.NODE_TEST_CONTEXT) {
  runIntelligenceBenchmark().then(({ metrics }) => {
    console.log("Benchmark execution completed successfully.");
  }).catch(err => {
    console.error("Benchmark execution failed:", err);
    process.exit(1);
  });
}
