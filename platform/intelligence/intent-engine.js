/**
 * SA-S03 Platform — Semantic Intent Understanding Engine
 * Extracts goal, domain, action, entities, risk level, and HITL requirements.
 */

export const IntentDomains = Object.freeze({
  DOCUMENT_INTELLIGENCE: "document_intelligence",
  ENGINEERING_INSPECTION: "engineering_inspection",
  DRAWING_PID: "drawing_pid",
  PLANT_SAFETY: "plant_safety",
  REFINERY_OPERATIONS: "refinery_operations",
  PROCUREMENT_COST: "procurement_cost",
  CODING_SANDBOX: "coding_sandbox",
  KNOWLEDGE_RAG: "knowledge_rag",
  ACADEMIC: "academic",
  FINANCE_SCHOLARSHIP: "finance_scholarship",
  STUDENT_SERVICES: "student-services",
  SOCIAL_MEDIA: "social_media",
  CODING_TECHNICAL: "coding_technical",
  WRITING_CONTENT: "writing_content",
  MULTI_DOMAIN: "multi_domain",
  UNRELATED: "unrelated"
});

export const RiskLevels = Object.freeze({
  NONE: "none",
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high"
});

const HIGH_RISK_ACTION_PATTERNS = [
  /change\s+(.*?)record/i,
  /modify\s+(.*?)record/i,
  /update\s+(.*?)balance/i,
  /disburse\s+/i,
  /award\s+scholarship/i,
  /approve\s+graduation/i,
  /delete\s+/i,
  /drop\s+/i,
  /override\s+grade/i,
  /change\s+fee/i,
  /alter\s+transcript/i
];

const MEDIUM_RISK_ACTION_PATTERNS = [
  /qualify\s+(for\s+)?scholarship/i,
  /scholarship\s+eligibility/i,
  /admission\s+eligibility/i,
  /recommend\s+/i,
  /clearance\s+evaluation/i
];

export function extractEntities(text) {
  const entities = {};
  const str = String(text || "");

  // Student ID pattern (STU-XXXX or STU-DEMO-XXX)
  const stuMatch = str.match(/\b(STU-[A-Z0-9-]+)\b/i);
  if (stuMatch) entities.student_id = stuMatch[1].toUpperCase();

  // Application ID (APP-XXXX)
  const appMatch = str.match(/\b(APP-[A-Z0-9-]+)\b/i);
  if (appMatch) entities.application_id = appMatch[1].toUpperCase();

  // Scholarship ID (SCH-XXXX)
  const schMatch = str.match(/\b(SCH-[A-Z0-9-]+)\b/i);
  if (schMatch) entities.scholarship_id = schMatch[1].toUpperCase();

  // Social handles (@username)
  const handleMatch = str.match(/@([A-Za-z0-9_.-]+)/);
  if (handleMatch) entities.handle = `@${handleMatch[1]}`;

  // Social platforms
  if (/instagram/i.test(str)) entities.platform = "instagram";
  else if (/twitter|tweet|x\.com/i.test(str)) entities.platform = "twitter";
  else if (/linkedin/i.test(str)) entities.platform = "linkedin";
  else if (/facebook/i.test(str)) entities.platform = "facebook";
  else if (/tiktok/i.test(str)) entities.platform = "tiktok";

  // Document types
  if (/income\s+cert(ificate)?/i.test(str)) entities.document_type = "income_certificate";
  else if (/transcript|marksheet/i.test(str)) entities.document_type = "academic_transcript";
  else if (/id\s+card|identity\s+proof/i.test(str)) entities.document_type = "id_proof";
  else if (/diploma|degree/i.test(str)) entities.document_type = "degree_certificate";

  // Scholarship scheme
  if (/merit\s+scholarship/i.test(str)) entities.scholarship_type = "merit";
  else if (/need\s+based|hardship/i.test(str)) entities.scholarship_type = "need_based";
  else if (/stem\s+scholarship/i.test(str)) entities.scholarship_type = "stem";

  return entities;
}

export function evaluateRisk(text, domain) {
  const str = String(text || "");
  for (const pattern of HIGH_RISK_ACTION_PATTERNS) {
    if (pattern.test(str)) {
      return { risk: RiskLevels.HIGH, requires_hitl: true, reason: "institutional_modification" };
    }
  }

  for (const pattern of MEDIUM_RISK_ACTION_PATTERNS) {
    if (pattern.test(str)) {
      return { risk: RiskLevels.MEDIUM, requires_hitl: true, reason: "high_impact_evaluation" };
    }
  }

  if (domain === IntentDomains.FINANCE_SCHOLARSHIP || domain === IntentDomains.MULTI_DOMAIN) {
    if (/scholarship|disbursement|award|fee/i.test(str)) {
      return { risk: RiskLevels.MEDIUM, requires_hitl: true, reason: "financial_evaluation" };
    }
  }

  return { risk: RiskLevels.LOW, requires_hitl: false, reason: "read_or_informational" };
}

export function parseIntent(prompt) {
  const text = String(prompt || "").trim();
  const lower = text.toLowerCase();
  const entities = extractEntities(text);

  // 1. Check Unrelated Trivia
  if (/what\s+is\s+the\s+capital\s+of/i.test(text) || /weather\s+in/i.test(text) || /how\s+tall\s+is/i.test(text)) {
    return {
      goal: "general_trivia",
      domain: IntentDomains.UNRELATED,
      action: "reject_or_out_of_scope",
      entities,
      risk: RiskLevels.NONE,
      requires_hitl: false,
      is_cross_domain: false,
      suggested_tools: []
    };
  }

  // 2. Check Multi-Domain / Multi-Step Request
  const mentionsAcademic = /attendance|attended|attending|cgpa|gpa|marks|grades|grade|course|syllabus|academic|classes|lectures|labs/i.test(lower);
  const mentionsFinance = /scholarship|fee|financial|tuition|bursar|disbursement|fellowship|concession|waiver|grant/i.test(lower);
  const mentionsDoc = /verify.*(document|income|cert|transcript|dossier|signature)|document|transcript|marksheet|certificate|income\s+cert|sha-256|ocr|pdf|dossier|scan/i.test(lower) || Boolean(entities.document_type);

  const domainCount = [mentionsAcademic, mentionsFinance, mentionsDoc].filter(Boolean).length;
  // If OCR / PDF / marksheet extraction without explicit multi-step workflow phrasing, it is primarily Document Intelligence
  const isDedicatedDocExtraction = (mentionsDoc && /ocr|extract.*(marks|fields)|marksheet\s+pdf|uploaded/i.test(lower)) && !/and\s+determine\s+whether|then\s+prepare|coordinate|recommend/i.test(lower);

  if (!isDedicatedDocExtraction && (domainCount >= 2 || /then\s+prepare|and\s+determine\s+whether|multi-step|coordinate/i.test(lower))) {
    const riskInfo = evaluateRisk(text, IntentDomains.MULTI_DOMAIN);
    return {
      goal: "multi_step_educational_evaluation",
      domain: IntentDomains.MULTI_DOMAIN,
      action: "coordinate_workflow",
      entities,
      risk: riskInfo.risk,
      requires_hitl: riskInfo.requires_hitl,
      is_cross_domain: true,
      suggested_tools: ["get_document", "get_marks", "get_attendance", "check_financial_eligibility"],
      candidate_agents: ["agent-045", "agent-006", "agent-085", "agent-101"]
    };
  }

  // 3. Document Intelligence
  if (mentionsDoc) {
    const riskInfo = evaluateRisk(text, IntentDomains.DOCUMENT_INTELLIGENCE);
    return {
      goal: "document_verification_and_extraction",
      domain: IntentDomains.DOCUMENT_INTELLIGENCE,
      action: "verify_document",
      entities,
      risk: riskInfo.risk,
      requires_hitl: riskInfo.requires_hitl,
      is_cross_domain: false,
      suggested_tools: ["get_document", "extract_document_data"],
      candidate_agents: ["agent-045", "agent-037"]
    };
  }

  // 4. Finance & Scholarship
  if (mentionsFinance) {
    const riskInfo = evaluateRisk(text, IntentDomains.FINANCE_SCHOLARSHIP);
    return {
      goal: "scholarship_and_financial_evaluation",
      domain: IntentDomains.FINANCE_SCHOLARSHIP,
      action: /change|modify|update|disburse/i.test(lower) ? "modify_financial_record" : "evaluate_scholarship",
      entities,
      risk: riskInfo.risk,
      requires_hitl: riskInfo.requires_hitl,
      is_cross_domain: false,
      suggested_tools: ["check_financial_eligibility", "get_fee_status", "get_scholarship_rules"],
      candidate_agents: ["agent-085", "agent-086"]
    };
  }

  // 5. Academic & Attendance
  if (mentionsAcademic) {
    const riskInfo = evaluateRisk(text, IntentDomains.ACADEMIC);
    return {
      goal: "academic_records_and_attendance_audit",
      domain: IntentDomains.ACADEMIC,
      action: "read_attendance",
      entities,
      risk: riskInfo.risk,
      requires_hitl: riskInfo.requires_hitl,
      is_cross_domain: false,
      suggested_tools: ["get_attendance", "get_marks", "get_grades"],
      candidate_agents: ["agent-034", "agent-003"]
    };
  }

  // 6. Social Media
  if (/instagram|twitter|tiktok|facebook|linkedin|social\s+media|@/i.test(lower)) {
    const riskInfo = evaluateRisk(text, IntentDomains.SOCIAL_MEDIA);
    return {
      goal: "social_media_analysis_and_strategy",
      domain: IntentDomains.SOCIAL_MEDIA,
      action: "profile_research",
      entities,
      risk: riskInfo.risk,
      requires_hitl: riskInfo.requires_hitl,
      is_cross_domain: false,
      suggested_tools: [],
      candidate_agents: ["agent-081", "agent-080"]
    };
  }

  // 7. Coding & Developer
  if (/python|javascript|typescript|c\+\+|sql|docker|function|algorithm|debug|refactor/i.test(lower)) {
    const riskInfo = evaluateRisk(text, IntentDomains.CODING_DEVELOPER);
    return {
      goal: "code_generation_and_engineering",
      domain: IntentDomains.CODING_DEVELOPER,
      action: "code_generation",
      entities,
      risk: riskInfo.risk,
      requires_hitl: riskInfo.requires_hitl,
      is_cross_domain: false,
      suggested_tools: [],
      candidate_agents: ["agent-061", "agent-055", "agent-075"]
    };
  }

  // 8. General / Ambiguous
  const riskInfo = evaluateRisk(text, IntentDomains.STUDENT_SERVICES);
  return {
    goal: "general_assistance",
    domain: IntentDomains.STUDENT_SERVICES,
    action: "clarify_or_general_audit",
    entities,
    risk: riskInfo.risk,
    requires_hitl: riskInfo.requires_hitl,
    is_cross_domain: false,
    suggested_tools: [],
    candidate_agents: ["agent-101", "agent-001"]
  };
}
