/**
 * SA-S03 Platform — Intelligent Workforce Router
 * Evaluates semantic relevance, domain matching, tool availability, and task decomposition.
 */

import { parseIntent, IntentDomains } from "./intent-engine.js";

export const SPECIALIST_CATALOG = [
  {
    agent_id: "agent-006",
    name: "Academic Performance & Course Records Agent",
    domain: IntentDomains.ACADEMIC,
    category: "foundation",
    capabilities: ["grammar-checking", "attendance-audit", "read_attendance", "academic-records"],
    tools: ["get_attendance", "get_marks", "get_grades"]
  },
  {
    agent_id: "agent-085",
    name: "Scholarship & Financial Aid Eligibility Evaluator Agent",
    domain: IntentDomains.FINANCE_SCHOLARSHIP,
    category: "business",
    capabilities: ["scholarship-eligibility", "fee-disbursement", "financial-analysis", "evaluate_scholarship"],
    tools: ["check_financial_eligibility", "get_fee_status", "get_scholarship_rules"]
  },
  {
    agent_id: "agent-045",
    name: "Institutional PDF & Transcript Processing Agent",
    domain: IntentDomains.DOCUMENT_INTELLIGENCE,
    category: "productivity",
    capabilities: ["document-classification", "data-extraction", "hash-verification", "verify_document"],
    tools: ["get_document", "extract_document_data", "classify_document"]
  },
  {
    agent_id: "agent-081",
    name: "AI Social Media Agent",
    domain: IntentDomains.SOCIAL_MEDIA,
    category: "business",
    capabilities: ["social-media", "social-content", "social-media-strategy", "social-media-research", "profile-analysis", "profile_research"],
    tools: []
  },
  {
    agent_id: "agent-061",
    name: "AI Code Generation Agent",
    domain: IntentDomains.CODING_DEVELOPER,
    category: "developer",
    capabilities: ["code-generation", "software-architecture", "debugging", "full-stack", "code_generation"],
    tools: []
  },
  {
    agent_id: "agent-002",
    name: "AI Email Agent",
    domain: IntentDomains.WRITING_CONTENT,
    category: "foundation",
    capabilities: ["email", "email-writing", "professional-email"],
    tools: []
  }
];

export function computeRoutingScore(agent, intent) {
  let score = 0;

  // Domain match
  if (agent.domain === intent.domain) score += 40;

  // Action match
  if (intent.action && agent.capabilities.some(c => c.includes(intent.action))) score += 25;

  // Tool availability match
  if (Array.isArray(intent.suggested_tools) && intent.suggested_tools.length > 0) {
    const matchedTools = intent.suggested_tools.filter(t => (agent.tools || []).includes(t));
    score += matchedTools.length * 15;
  }

  // Entity match
  if (intent.entities?.handle && agent.domain === IntentDomains.SOCIAL_MEDIA) score += 20;
  if (intent.entities?.document_type && agent.domain === IntentDomains.DOCUMENT_INTELLIGENCE) score += 20;
  if (intent.entities?.scholarship_type && agent.domain === IntentDomains.FINANCE_SCHOLARSHIP) score += 20;

  return score;
}

export function routeRequest(prompt, options = {}) {
  const intent = parseIntent(prompt);

  // If cross-domain multi-step task, route to Master Orchestrator (agent-101) with DAG plan
  if (intent.is_cross_domain || intent.domain === IntentDomains.MULTI_DOMAIN) {
    return {
      mode: "multi_agent_dag",
      primary_agent: "agent-101",
      intent,
      plan: {
        steps: [
          {
            step_id: "step_1_document_verification",
            agent_id: "agent-045",
            task: `Verify document authenticity and extract verified fields for ${intent.entities.student_id || "the student"}.`,
            tools: ["get_document"],
            dependencies: []
          },
          {
            step_id: "step_2_academic_standing",
            agent_id: "agent-006",
            task: `Retrieve GPA, marks, and attendance records for ${intent.entities.student_id || "the student"}.`,
            tools: ["get_marks", "get_attendance"],
            dependencies: []
          },
          {
            step_id: "step_3_scholarship_evaluation",
            agent_id: "agent-085",
            task: `Evaluate scholarship eligibility and financial ledger standing based on verified academic and document evidence.`,
            tools: ["check_financial_eligibility", "get_fee_status"],
            dependencies: ["step_1_document_verification", "step_2_academic_standing"]
          },
          {
            step_id: "step_4_final_synthesis_and_hitl",
            agent_id: "agent-101",
            task: `Synthesize comprehensive decision, assemble evidence ledger, and flag for Human-In-The-Loop approval if required.`,
            tools: ["record_decision"],
            dependencies: ["step_3_scholarship_evaluation"]
          }
        ]
      }
    };
  }

  // Single Agent Routing
  let bestAgent = null;
  let highestScore = -1;

  for (const agent of SPECIALIST_CATALOG) {
    const score = computeRoutingScore(agent, intent);
    if (score > highestScore) {
      highestScore = score;
      bestAgent = agent;
    }
  }

  if (highestScore >= 30 && bestAgent) {
    return {
      mode: "single_agent",
      primary_agent: bestAgent.agent_id,
      agent_name: bestAgent.name,
      confidence: highestScore,
      intent,
      recommended_tools: intent.suggested_tools || []
    };
  }

  // Fallback to Master Orchestrator or general clarification
  return {
    mode: "direct_master",
    primary_agent: "agent-101",
    agent_name: "AI Master Agent",
    confidence: 20,
    intent,
    recommended_tools: []
  };
}
