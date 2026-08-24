/**
 * Sovereign AI Workbench — Universal Task & Agent Classifier
 * Maps natural language instructions, prompts, problem statements, and OCR-extracted
 * text to canonical 301 AI Specialist Agents and appropriate local LLMs.
 * 
 * Shared 100% symmetrically between typed text input and OCR image text input.
 */

export const TaskType = Object.freeze({
  EMAIL_WRITING: "EMAIL_WRITING",
  PYTHON_PROGRAMMING: "PYTHON_PROGRAMMING",
  CODE_GENERATION: "CODE_GENERATION",
  MATHEMATICS_LOGIC: "MATHEMATICS_LOGIC",
  DOCUMENT_ANALYSIS: "DOCUMENT_ANALYSIS",
  SUMMARIZATION: "SUMMARIZATION",
  GRAMMAR_REWRITE: "GRAMMAR_REWRITE",
  GENERAL_WRITING: "GENERAL_WRITING",
  RESEARCH_QUERY: "RESEARCH_QUERY",
  DATA_ANALYTICS: "DATA_ANALYTICS"
});

export const TASK_DEFINITIONS = {
  [TaskType.EMAIL_WRITING]: {
    label: "Email Writing",
    agentId: "agent-002",
    agentNumber: "002",
    agentName: "Email AI Agent",
    domain: "Writing & Communication",
    recommendedModel: "nemotron-3-nano:latest",
    patterns: [
      /\b(?:write|draft|compose|send|create)\s+(?:a\s+|an\s+)?(?:professional\s+|formal\s+|follow-up\s+|resignation\s+|business\s+)?email\b/i,
      /\bemail\s+to\s+(?:my\s+|the\s+)?(?:manager|boss|team|client|professor|hr|lead|colleague)\b/i,
      /\brequesting\s+a\s+project\s+review\b/i,
      /\bemail\s+template\b/i,
      /\bsubject\s*:\s*.*\b/i
    ]
  },
  [TaskType.PYTHON_PROGRAMMING]: {
    label: "Python Programming",
    agentId: "agent-101",
    agentNumber: "101",
    agentName: "Python AsyncIO AI Agent",
    domain: "Python Core & Async",
    recommendedModel: "qwen2.5-coder:1.5b",
    patterns: [
      /\b(?:python|py)\b/i,
      /\bpalindrome\s+(?:program|function|script|algorithm)\b/i,
      /\bdef\s+[a-zA-Z_]\w*\s*\(/i,
      /\basync\s+def\b/i,
      /\bimport\s+(?:asyncio|numpy|pandas|os|sys|fastapi|flask|pytest)\b/i,
      /\bpython\s+(?:code|script|program|solution)\b/i
    ]
  },
  [TaskType.CODE_GENERATION]: {
    label: "Code Generation",
    agentId: "agent-061",
    agentNumber: "061",
    agentName: "Code Generation AI Agent",
    domain: "Coding & Development",
    recommendedModel: "qwen2.5-coder:1.5b",
    patterns: [
      /\b(?:write|create|generate|implement)\s+(?:a\s+)?(?:code|program|function|algorithm|class|api|script|component)\b/i,
      /\b(?:javascript|typescript|react|nextjs|java|c\+\+|cpp|csharp|golang|go|rust|sql|html|css)\b/i,
      /\bfunction\s+[a-zA-Z_]\w*\s*\(/i,
      /\bconst\s+[a-zA-Z_]\w*\s*=/i,
      /\bclass\s+[A-Z]\w*\b/i
    ]
  },
  [TaskType.MATHEMATICS_LOGIC]: {
    label: "Mathematics & Logic",
    agentId: "agent-003",
    agentNumber: "003",
    agentName: "Study AI Agent",
    domain: "Education & Learning",
    recommendedModel: "phi4-mini",
    patterns: [
      /\b(?:solve|calculate|compute|evaluate|integrate|differentiate)\b/i,
      /\b\d+\s*(?:[×*xX+\-/÷^]|plus|minus|times|multiplied\s+by|divided\s+by)\s*\d+\b/i,
      /\b\d+x\s*[\+\-]\s*\d+\s*=\s*\d+\b/i,
      /\b(?:equation|formula|matrix|integral|derivative|algebra|calculus|geometry|probability|theorem)\b/i,
      /\b17\s*[×*xX]\s*28\b/i,
      /\b2x\s*\+\s*5\s*=\s*15\b/i
    ]
  },
  [TaskType.SUMMARIZATION]: {
    label: "Summarization",
    agentId: "agent-005",
    agentNumber: "005",
    agentName: "Summarization AI Agent",
    domain: "Writing & Communication",
    recommendedModel: "smollm2:1.7b",
    patterns: [
      /\b(?:summarize|summary|tldr|tl;dr|key takeaways|bullet points summary|briefly explain)\b/i
    ]
  },
  [TaskType.GRAMMAR_REWRITE]: {
    label: "Grammar & Rewriting",
    agentId: "agent-006",
    agentNumber: "006",
    agentName: "Grammar AI Agent",
    domain: "Writing & Communication",
    recommendedModel: "smollm2:1.7b",
    patterns: [
      /\b(?:proofread|fix grammar|correct spelling|rewrite|rephrase|paraphrase|improve writing)\b/i
    ]
  },
  [TaskType.DOCUMENT_ANALYSIS]: {
    label: "Document Analysis",
    agentId: "agent-045",
    agentNumber: "045",
    agentName: "PDF Processing AI Agent",
    domain: "Automation & Productivity",
    recommendedModel: "granite4:1b-h",
    patterns: [
      /\b(?:analyze document|extract table|parse invoice|read pdf|extract data|document query)\b/i
    ]
  },
  [TaskType.GENERAL_WRITING]: {
    label: "General Writing",
    agentId: "agent-001",
    agentNumber: "001",
    agentName: "Writing AI Agent",
    domain: "Writing & Communication",
    recommendedModel: "nemotron-3-nano:latest",
    patterns: [
      /\b(?:write|essay|article|blog|story|letter|report|overview)\b/i
    ]
  }
};

export function classifyTaskAndAgent(text) {
  const clean = String(text || "").trim();
  if (!clean) {
    return {
      taskType: TaskType.GENERAL_WRITING,
      taskLabel: TASK_DEFINITIONS[TaskType.GENERAL_WRITING].label,
      agentId: TASK_DEFINITIONS[TaskType.GENERAL_WRITING].agentId,
      agentNumber: TASK_DEFINITIONS[TaskType.GENERAL_WRITING].agentNumber,
      agentName: TASK_DEFINITIONS[TaskType.GENERAL_WRITING].agentName,
      domain: TASK_DEFINITIONS[TaskType.GENERAL_WRITING].domain,
      recommendedModel: TASK_DEFINITIONS[TaskType.GENERAL_WRITING].recommendedModel,
      confidence: 0.5,
      matchedPattern: "default"
    };
  }

  for (const [taskKey, def] of Object.entries(TASK_DEFINITIONS)) {
    for (const pattern of def.patterns) {
      if (pattern.test(clean)) {
        return {
          taskType: taskKey,
          taskLabel: def.label,
          agentId: def.agentId,
          agentNumber: def.agentNumber,
          agentName: def.agentName,
          domain: def.domain,
          recommendedModel: def.recommendedModel,
          confidence: 0.96,
          matchedPattern: pattern.toString()
        };
      }
    }
  }

  const fallback = TASK_DEFINITIONS[TaskType.GENERAL_WRITING];
  return {
    taskType: TaskType.GENERAL_WRITING,
    taskLabel: fallback.label,
    agentId: fallback.agentId,
    agentNumber: fallback.agentNumber,
    agentName: fallback.agentName,
    domain: fallback.domain,
    recommendedModel: fallback.recommendedModel,
    confidence: 0.70,
    matchedPattern: "fallback"
  };
}
