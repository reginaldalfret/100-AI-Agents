/**
 * SA-S03 Platform — Nemotron Intelligence Baseline Audit
 * Phase 3-18: Application Routing, Tool Calling, Evidence Reasoning, Multi-Agent, HITL, and Context Audit
 */

import { parseIntent, routeRequest, IntentDomains, RiskLevels } from "../../platform/intelligence/index.js";
import { callToolStructured } from "../../platform/intelligence/tool-caller.js";
import { synthesizeEpistemicFindings, formatGroundedAnswer, EpistemicType } from "../../platform/intelligence/reasoner.js";
import { executeDAGPlan, detectEvidenceConflicts } from "../../platform/intelligence/coordinator.js";
import { classifyActionRisk, evaluateHITLRequirement } from "../../platform/intelligence/hitl-policy.js";
import { createExecutionContext } from "../../platform/intelligence/context-manager.js";

export async function runAppRoutingAudit() {
  console.log("===============================================================");
  console.log("  PHASE 3-18 — APPLICATION ROUTING & WORKFORCE AUDIT");
  console.log("===============================================================\n");

  const results = {
    routingParaphrases: { total: 50, passed: 0, latencies: [] },
    falseRejections: { total: 10, passed: 0, latencies: [] },
    toolSelection: { total: 8, passed: 0, latencies: [] },
    evidenceGrounding: { total: 5, passed: 0, latencies: [] },
    multiAgentDAG: { total: 4, passed: 0, latencies: [] },
    hitlRiskGating: { total: 6, passed: 0, latencies: [] },
    documentFoundation: { total: 4, passed: 0, latencies: [] },
    contextManagement: { total: 4, passed: 0, latencies: [] }
  };

  // -------------------------------------------------------------
  // 1. ROUTING PARAPHRASE AUDIT (10 DOMAINS x 5 PARAPHRASES = 50)
  // -------------------------------------------------------------
  console.log("--- [Routing Audit] 50 Multi-Domain Paraphrase Queries ---");
  const paraphraseSuite = [
    // 1. Student Information
    { d: "student", exp: "agent-101", p: "Look up student STU-1001's general file." },
    { d: "student", exp: "agent-101", p: "Can you retrieve the record for student STU-1001?" },
    { d: "student", exp: "agent-101", p: "Show me details for STU-1001." },
    { d: "student", exp: "agent-101", p: "Fetch student profile for STU-1001." },
    { d: "student", exp: "agent-101", p: "Display demographic intake for STU-1001." },

    // 2. Academic Performance
    { d: "academic", exp: "agent-006", p: "Check student STU-1001's GPA and coursework grades." },
    { d: "academic", exp: "agent-006", p: "What marks did STU-1001 score in semester 4?" },
    { d: "academic", exp: "agent-006", p: "Review academic coursework standing for STU-1001." },
    { d: "academic", exp: "agent-006", p: "Fetch semester grade report for STU-1001." },
    { d: "academic", exp: "agent-006", p: "Show cumulative GPA for STU-1001." },

    // 3. Attendance
    { d: "attendance", exp: "agent-006", p: "Check student STU-1001's class attendance." },
    { d: "attendance", exp: "agent-006", p: "How often has student STU-1001 attended lectures?" },
    { d: "attendance", exp: "agent-006", p: "Review attendance percentage for STU-1001." },
    { d: "attendance", exp: "agent-006", p: "Is STU-1001 meeting the 75% attendance rule?" },
    { d: "attendance", exp: "agent-006", p: "Fetch lecture attendance logs for STU-1001." },

    // 4. Scholarship Eligibility
    { d: "scholarship", exp: "agent-085", p: "Can this student qualify for the merit scholarship?" },
    { d: "scholarship", exp: "agent-085", p: "Evaluate whether STU-1001 is eligible for scholarship award." },
    { d: "scholarship", exp: "agent-085", p: "Would STU-1001 receive financial aid concession?" },
    { d: "scholarship", exp: "agent-085", p: "Check scholarship rules for SCH-MERIT scheme." },
    { d: "scholarship", exp: "agent-085", p: "Assess STU-1001 for need-based tuition grant." },

    // 5. Finance & Fee Status
    { d: "finance", exp: "agent-085", p: "Check student fee balance and outstanding dues." },
    { d: "finance", exp: "agent-085", p: "How much tuition fee does STU-1001 owe the bursar?" },
    { d: "finance", exp: "agent-085", p: "Retrieve payment transaction history for STU-1001." },
    { d: "finance", exp: "agent-085", p: "Is student STU-1001 cleared financially for registration?" },
    { d: "finance", exp: "agent-085", p: "Review bursar balance sheet for STU-1001." },

    // 6. Document Verification
    { d: "document", exp: "agent-045", p: "Verify this student's income certificate." },
    { d: "document", exp: "agent-045", p: "Validate SHA-256 hash on uploaded transcript PDF." },
    { d: "document", exp: "agent-045", p: "Extract structured data from high school marksheet." },
    { d: "document", exp: "agent-045", p: "Check whether DOC-8001 has tamper indicators." },
    { d: "document", exp: "agent-045", p: "Classify uploaded identity proof document scan." },

    // 7. Admission
    { d: "admission", exp: "agent-101", p: "Check admission application status for APP-2026-094." },
    { d: "admission", exp: "agent-101", p: "Calculate composite entrance merit rank for admission seat." },
    { d: "admission", exp: "agent-101", p: "Evaluate high school rank eligibility for new applicant." },
    { d: "admission", exp: "agent-101", p: "Review admission dossier for engineering intake." },
    { d: "admission", exp: "agent-101", p: "Check applicant cutoff ranking for Computer Science." },

    // 8. Communication & Notice
    { d: "communication", exp: "agent-002", p: "Draft an official email notice regarding exam schedule." },
    { d: "communication", exp: "agent-002", p: "Write professional email responding to parent inquiry." },
    { d: "communication", exp: "agent-002", p: "Draft formal memorandum on academic counseling." },
    { d: "communication", exp: "agent-002", p: "Send email draft to faculty advisory board." },
    { d: "communication", exp: "agent-002", p: "Compose orientation welcome message for new cohort." },

    // 9. Social Media
    { d: "social", exp: "agent-081", p: "Research about the Instagram account @example." },
    { d: "social", exp: "agent-081", p: "Analyze this Twitter profile and follower metrics." },
    { d: "social", exp: "agent-081", p: "Create social media marketing strategy for student recruitment." },
    { d: "social", exp: "agent-081", p: "Review engagement rates on our university TikTok page." },
    { d: "social", exp: "agent-081", p: "Tell me what this social media creator profile is about." },

    // 10. Multi-Agent Workflow Coordination
    { d: "multi_step", exp: "agent-101", p: "Check the student's academic record and determine whether they qualify financially for the scholarship." },
    { d: "multi_step", exp: "agent-101", p: "Verify the student's documents, check their academic eligibility, then prepare the scholarship recommendation." },
    { d: "multi_step", exp: "agent-101", p: "Audit student attendance, review GPA, and evaluate if hardship concession applies." },
    { d: "multi_step", exp: "agent-101", p: "Cross-verify income certificate with bursar fee database and prepare financial aid clearance." },
    { d: "multi_step", exp: "agent-101", p: "Perform complete graduation audit: check GPA, verify attendance >= 75%, and check fee clearance." }
  ];

  for (let i = 0; i < paraphraseSuite.length; i++) {
    const item = paraphraseSuite[i];
    const started = Date.now();
    const route = routeRequest(item.p);
    const latency_ms = Date.now() - started;
    const passed = route.primary_agent === item.exp;
    if (passed) results.routingParaphrases.passed++;
    results.routingParaphrases.latencies.push(latency_ms);
  }
  console.log(`  Routing Paraphrase Result: ${results.routingParaphrases.passed}/50 Passed (${((results.routingParaphrases.passed/50)*100).toFixed(1)}%)`);

  // -------------------------------------------------------------
  // 2. FALSE REJECTION AUDIT (CRITICAL GATEWAY METRIC)
  // -------------------------------------------------------------
  console.log("\n--- [False Rejection Audit] Testing Legitimate Requests with Unusual Phrasings ---");
  const unusualRequests = [
    "Research about the Instagram account @reginaldalfret",
    "Tell me what this student's academic situation looks like.",
    "Would this student be suitable for the scholarship?",
    "Look through this document and tell me if anything is wrong.",
    "Can you investigate why this student isn't graduating?",
    "Can you check how often STU-1001 has been attending classes?",
    "Please evaluate whether Demosthenes meets our financial aid rules.",
    "Is there any reason why STU-1002 cannot register for advanced courses?",
    "Help me prepare the annual scholarship merit list for faculty committee.",
    "Verify the authenticity of this student's uploaded certificate file."
  ];

  let falselyRejected = 0;
  for (const req of unusualRequests) {
    const route = routeRequest(req);
    const isRejected = route.intent.action === "reject_or_out_of_scope";
    if (isRejected) falselyRejected++;
    else results.falseRejections.passed++;
  }
  const falseRejectionRate = ((falselyRejected / unusualRequests.length) * 100).toFixed(1);
  console.log(`  False Rejection Rate: ${falseRejectionRate}% (${falselyRejected}/${unusualRequests.length}) [TARGET: 0.0%]`);

  // -------------------------------------------------------------
  // 3. TOOL CALLING & RBAC ENFORCEMENT AUDIT
  // -------------------------------------------------------------
  console.log("\n--- [Tool Calling Audit] Model/Application Tool Execution & RBAC ---");
  const toolAuditTests = [
    { agent: "agent-006", tool: "get_attendance", args: { student_id: "STU-1001" }, expectedSuccess: true },
    { agent: "agent-006", tool: "get_marks", args: { student_id: "STU-1001" }, expectedSuccess: true },
    { agent: "agent-085", tool: "check_financial_eligibility", args: { student_id: "STU-1001" }, expectedSuccess: true },
    { agent: "agent-085", tool: "get_fee_status", args: { student_id: "STU-1001" }, expectedSuccess: true },
    { agent: "agent-045", tool: "get_document", args: { document_id: "DOC-8002" }, expectedSuccess: true },
    { agent: "agent-081", tool: "get_fee_status", args: { student_id: "STU-1001" }, expectedSuccess: false }, // RBAC violation
    { agent: "agent-061", tool: "check_financial_eligibility", args: { student_id: "STU-1001" }, expectedSuccess: false }, // RBAC violation
    { agent: "agent-101", tool: "record_decision", args: { workflow_id: "WF-AUDIT-01", decision: "TEST" }, expectedSuccess: true }
  ];

  for (let i = 0; i < toolAuditTests.length; i++) {
    const t = toolAuditTests[i];
    const res = await callToolStructured({ agent_id: t.agent, tool_name: t.tool, arguments: t.args });
    const passed = (res.success === t.expectedSuccess) || (!t.expectedSuccess && res.error_code === "PERMISSION_DENIED");
    if (passed) results.toolSelection.passed++;
    console.log(`  Tool Test #${i+1} [${t.agent} -> ${t.tool}]: ${passed ? "PASS" : "FAIL"} (Success: ${res.success})`);
  }

  // -------------------------------------------------------------
  // 4. EVIDENCE REASONING & CONFLICT DETECTION AUDIT
  // -------------------------------------------------------------
  console.log("\n--- [Evidence Reasoning Audit] Fact vs Inference vs Conflict ---");
  const facts = [
    { attribute: "cgpa", value: 8.4, source: "AcademicService" },
    { attribute: "attendance", value: 92, source: "AcademicService" },
    { attribute: "income", value: 120000, source: "FinanceService" }
  ];
  const rules = [
    { name: "CGPA Standard", check: (f) => ({ evaluated: true, satisfied: f.find(x => x.attribute === "cgpa")?.value >= 8.0, reasoning: "Meets 8.0" }) },
    { name: "Attendance Standard", check: (f) => ({ evaluated: true, satisfied: f.find(x => x.attribute === "attendance")?.value >= 75, reasoning: "Meets 75%" }) }
  ];
  const findings = synthesizeEpistemicFindings({ facts, rules });
  const evidencePassed = findings.is_fully_grounded && findings.facts.length === 3 && findings.inferences.length === 2;
  if (evidencePassed) results.evidenceGrounding.passed++;

  // Conflict test
  const conflictingData = [
    { source: "DocumentService", data: { annualIncome: 120000 } },
    { source: "DatabaseLedger", data: { annualIncome: 180000 } }
  ];
  const conflicts = detectEvidenceConflicts(conflictingData);
  const conflictPassed = conflicts.length === 1 && conflicts[0].type === "INCOME_DISCREPANCY";
  if (conflictPassed) results.evidenceGrounding.passed++;

  console.log(`  Evidence Grounding & Fact Classification: ${evidencePassed ? "PASS" : "FAIL"}`);
  console.log(`  Discrepancy Conflict Detection: ${conflictPassed ? "PASS" : "FAIL"} (Found: ${conflicts[0]?.type})`);

  // -------------------------------------------------------------
  // 5. MULTI-AGENT DAG EXECUTION AUDIT
  // -------------------------------------------------------------
  console.log("\n--- [Multi-Agent Coordination Audit] Executing 4-Step DAG ---");
  const dagRoute = routeRequest("Check the student's academic record and determine whether they qualify financially for the scholarship.");
  const dagExec = await executeDAGPlan(dagRoute.plan, { entities: { studentId: "STU-1001", student_id: "STU-1001", document_id: "DOC-8001" } });
  if (dagExec.success) results.multiAgentDAG.passed += 2;
  console.log(`  Multi-Agent DAG Execution: ${dagExec.success ? "PASS (4 Steps Completed)" : "FAIL"}`);

  // -------------------------------------------------------------
  // 6. HITL RISK GATING AUDIT
  // -------------------------------------------------------------
  console.log("\n--- [HITL Risk Policy Audit] READ vs RECOMMEND vs MODIFY ---");
  const hitlTests = [
    { action: "get_student_profile", expRisk: "low", expHitl: false },
    { action: "get_attendance", expRisk: "low", expHitl: false },
    { action: "evaluate_scholarship", expRisk: "medium", expHitl: true },
    { action: "disburse_scholarship_ledger", expRisk: "high", expHitl: true },
    { action: "graduation_clearance", expRisk: "high", expHitl: true },
    { action: "prerequisite_override", expRisk: "high", expHitl: true }
  ];

  for (let i = 0; i < hitlTests.length; i++) {
    const item = hitlTests[i];
    const policy = classifyActionRisk(item.action);
    const hitl = evaluateHITLRequirement({ action: item.action, risk: policy.level, userRole: "ai_agent" });
    const passed = policy.level === item.expRisk && hitl.requires_hitl === item.expHitl;
    if (passed) results.hitlRiskGating.passed++;
    console.log(`  HITL Test #${i+1} [${item.action}]: ${passed ? "PASS" : "FAIL"} (Risk: ${policy.level}, HITL Required: ${hitl.requires_hitl})`);
  }

  // -------------------------------------------------------------
  // 7. TIER-2 CONVERSATION & CONTEXT AUDIT
  // -------------------------------------------------------------
  console.log("\n--- [Tier-2 Context Audit] Context Container & Trace Binding ---");
  const ctx = createExecutionContext({
    student_id: "STU-1001",
    entities: { gpa: 3.85, program: "Computer Science" }
  });
  ctx.addFact({ attribute: "attendance", value: 96.4, source: "AcademicService" });
  const hasTrace = ctx.trace_id.startsWith("INT-");
  const hasStudent = ctx.student_id === "STU-1001";
  const hasFacts = ctx.verified_facts.length === 1;
  const contextPassed = hasTrace && hasStudent && hasFacts;
  if (contextPassed) results.contextManagement.passed += 2;
  console.log(`  Unified Context Container: ${contextPassed ? "PASS" : "FAIL"} (Trace ID: ${ctx.trace_id})`);

  return results;
}

if (process.argv[1].endsWith("app-routing-audit.js")) {
  runAppRoutingAudit().then(res => {
    console.log("\nApplication Routing Audit Completed Successfully.");
  });
}
