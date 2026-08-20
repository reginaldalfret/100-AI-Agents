/**
 * SA-S03 & 100 AI Agents Platform — Intelligent Permissive Capability Gate
 * Evaluates semantic relevance, safety, and specialist routing recommendations.
 */

export const DecisionType = Object.freeze({
  ALLOW: "ALLOW",
  ROUTE: "ROUTE",
  CLARIFY: "CLARIFY",
  REJECT: "REJECT"
});

export const SAFETY_PATTERNS = [
  /bypass\s+(all\s+)?(safety|security|rules|guardrails|authorization|controls)/i,
  /ignore\s+(all\s+)?(safety|security|rules|instructions|guardrails)/i,
  /access\s+restricted\s+(account|data|credentials|keys|passwords)/i,
  /drop\s+(table|database|schema)\s+/i,
  /rm\s+-rf\s+/i,
  /format\s+c:/i,
  /exploit\s+vulnerability/i,
  /sql\s+injection/i
];

export const STOP_WORDS = new Set([
  "ai", "agent", "and", "for", "the", "with", "from", "this", "that", "have", "make", "help", "task", "work"
]);

export const GENERIC_VERBS = new Set([
  "generate", "generat", "generation",
  "write", "writ", "writing",
  "create", "creat", "creation",
  "build", "make", "perform",
  "provide", "synthesize", "help",
  "assist", "work", "task", "agent", "ai"
]);

export const GLOBAL_DOMAIN_TAXONOMY = [
  {
    domain: "social_media",
    name: "AI Social Media Agent",
    agent_id: "agent-081",
    category: "business",
    keywords: [
      "social media", "social-media", "instagram", "twitter", "tweet", "facebook",
      "tiktok", "linkedin", "youtube", "threads", "pinterest", "reddit",
      "profile", "account", "handle", "follower", "following", "engagement",
      "post", "reel", "story", "influencer", "hashtag", "bio", "social strategy",
      "campaign", "creator", "likes", "comments", "dms", "social content"
    ],
    capabilities: [
      "social-media", "social-content", "social-media-strategy", "social-engagement",
      "profile-analysis", "content-analysis", "engagement-analysis", "social-media-research"
    ]
  },
  {
    domain: "marketing",
    name: "AI Marketing Agent",
    agent_id: "agent-080",
    category: "business",
    keywords: [
      "marketing", "marketing campaign", "marketing newsletter", "newsletter",
      "advertisement", "ad copy", "seo marketing", "sales funnel"
    ],
    capabilities: [
      "marketing", "marketing-campaigns", "copywriting", "lead-generation"
    ]
  },
  {
    domain: "translation",
    name: "AI Translation Agent",
    agent_id: "agent-007",
    category: "foundation",
    keywords: [
      "translate", "translation", "spanish", "french", "german", "mandarin",
      "hindi", "japanese", "chinese", "italian", "russian", "arabic", "multilingual", "localize"
    ],
    capabilities: [
      "translation", "language-translation", "localization", "multilingual"
    ]
  },
  {
    domain: "email",
    name: "AI Email Agent",
    agent_id: "agent-002",
    category: "foundation",
    keywords: [
      "email", "e-mail", "subject line", "inbox", "outbox", "mail draft",
      "internship inquiry", "newsletter email", "email reply", "professional email"
    ],
    capabilities: [
      "email", "email-writing", "email-reply", "professional-email", "email-management"
    ]
  },
  {
    domain: "quiz",
    name: "AI Quiz Agent",
    agent_id: "agent-004",
    category: "foundation",
    keywords: [
      "quiz", "mcq", "multiple choice", "multiple-choice", "question bank",
      "trivia", "answer key", "exam prep", "questions", "chemistry"
    ],
    capabilities: [
      "quiz", "mcq", "question-generation", "exam-prep"
    ]
  },
  {
    domain: "summarization",
    name: "AI Summarization Agent",
    agent_id: "agent-005",
    category: "foundation",
    keywords: [
      "summarize", "summary", "tldr", "synopsis", "key takeaways",
      "executive summary", "condense this"
    ],
    capabilities: [
      "summarization", "text-summarization", "book-summarization", "briefing"
    ]
  },
  {
    domain: "writing",
    name: "AI Writing Agent",
    agent_id: "agent-001",
    category: "foundation",
    keywords: [
      "essay", "article", "creative writing", "blog post", "draft manuscript",
      "narrative", "poem", "poetry", "script", "copywriting", "press release",
      "fiction", "fantasy story", "short story", "story about", "novel chapter",
      "creative novel", "formal letter", "letter to"
    ],
    capabilities: [
      "writing", "article-writing", "essay-writing", "creative-writing", "copywriting"
    ]
  },
  {
    domain: "career_resume",
    name: "AI Resume & Career Agent",
    agent_id: "agent-013",
    category: "foundation",
    keywords: [
      "resume", "résumé", "cv", "curriculum vitae", "ats score", "ats optimization",
      "job application", "career advisor", "career planning", "career transition",
      "interview prep", "job matching", "cover letter"
    ],
    capabilities: [
      "resume", "resume-writing", "resume-editing", "career-advisor", "job-matching",
      "career-advice", "career-planning", "career-paths", "skill-development"
    ]
  },
  {
    domain: "coding_developer",
    name: "AI Code Generation Agent",
    agent_id: "agent-061",
    category: "developer",
    keywords: [
      "javascript", "python", "typescript", "c++", "java", "rust", "go", "php", "ruby",
      "coding", "programming", "algorithm", "refactor", "debug", "docker", "sql",
      "database", "postgresql", "mysql", "mongodb", "schema", "query", "queries", "api",
      "endpoint", "full stack", "devops", "ci-cd", "dockerfile", "kubernetes", "pull request",
      "react", "node.js", "microservice", "memory leak", "useeffect", "relational", "join",
      "index tuning", "script", "fibonacci", "sorting program", "solid architecture", "docker container"
    ],
    capabilities: [
      "code-generation", "software-architecture", "debugging", "code-review",
      "full-stack", "devops", "docker", "ci-cd", "database", "code-refactoring", "bug-hunting"
    ]
  },
  {
    domain: "finance_scholarship",
    name: "Academic and Financial Aid Specialist",
    agent_id: "agent-085",
    category: "business",
    keywords: [
      "scholarship", "financial aid", "grant", "tuition", "fee", "bursar",
      "award", "discount", "stipend", "waiver", "income certificate", "ledger",
      "balance sheet", "invoice", "financial analysis", "accounting", "funds", "ebitda", "budget"
    ],
    capabilities: [
      "scholarship-eligibility", "fee-disbursement", "financial-analysis", "accounting",
      "finance", "financial", "invoice-processing"
    ]
  },
  {
    domain: "document_intelligence",
    name: "Document Intelligence and Verification Agent",
    agent_id: "agent-045",
    category: "productivity",
    keywords: [
      "document", "pdf", "transcript", "certificate", "diploma", "id card",
      "scan document", "ocr", "extract fields", "tamper detection", "hash verification",
      "file organization", "spreadsheet", "excel"
    ],
    capabilities: [
      "document-classification", "data-extraction", "hash-verification", "ocr",
      "document-processing", "pdf-processing", "file-organization"
    ]
  },
  {
    domain: "academics_education",
    name: "Academic Advisory and Course Specialist",
    agent_id: "agent-034",
    category: "research",
    keywords: [
      "course", "syllabus", "prerequisite", "gpa", "grade", "attendance rate",
      "semester", "curriculum", "professor", "student enrollment", "course override",
      "academic record", "degree audit", "graduation clearance", "study notes"
    ],
    capabilities: [
      "course-audit", "prerequisite-check", "academic-planning", "advisory",
      "course-research", "syllabus-analysis", "curriculum-evaluation"
    ]
  },
  {
    domain: "travel_restaurant",
    name: "Travel & Dining Specialist",
    agent_id: "agent-032",
    category: "research",
    keywords: [
      "travel itinerary", "flight booking", "hotel reservation", "vacation plan",
      "tourist guide", "restaurant recommendation", "dining menu", "recipe"
    ],
    capabilities: [
      "travel-research", "restaurant-research"
    ]
  }
];

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9@_\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesPhrase(text, phrase) {
  const normText = " " + normalize(text) + " ";
  const normPhrase = " " + normalize(phrase) + " ";
  return normText.includes(normPhrase);
}

function getCapabilityTokens(capabilities, agentName) {
  const tokens = new Set();
  const rawTokens = [];

  (capabilities || []).forEach(c => {
    const parts = String(c).toLowerCase().split(/[-_\s]+/);
    parts.forEach(p => rawTokens.push(p));
  });

  String(agentName || "").toLowerCase().split(/[-_\s]+/).forEach(p => {
    if (p && !STOP_WORDS.has(p)) rawTokens.push(p);
  });

  rawTokens.forEach(p => {
    if (p.length >= 3 && !STOP_WORDS.has(p)) {
      tokens.add(p);
      if (p.endsWith("ing") && p.length > 5) tokens.add(p.slice(0, -3));
      if (p.endsWith("tion") && p.length > 6) tokens.add(p.slice(0, -4));
      if (p.endsWith("sion") && p.length > 6) tokens.add(p.slice(0, -4));
      if (p.endsWith("ment") && p.length > 6) tokens.add(p.slice(0, -4));
      if (p.endsWith("er") && p.length > 4) tokens.add(p.slice(0, -2));
      if (p.endsWith("or") && p.length > 4) tokens.add(p.slice(0, -2));
      if (p.endsWith("es") && p.length > 4) tokens.add(p.slice(0, -2));
      if (p.endsWith("s") && p.length > 3) tokens.add(p.slice(0, -1));
    }
  });

  return tokens;
}

export function checkSafety(task) {
  for (const pattern of SAFETY_PATTERNS) {
    if (pattern.test(task)) {
      return { blocked: true, reason: "safety-policy-violation" };
    }
  }
  return { blocked: false };
}

export function checkCapability(task, config = {}) {
  const normalizedTask = normalize(task);
  const capabilities = Array.isArray(config.capabilities) ? config.capabilities : [];

  // 1. Safety Check (High Priority)
  const safety = checkSafety(task);
  if (safety.blocked) {
    return {
      allowed: false,
      decision: DecisionType.REJECT,
      reason: safety.reason,
      detectedIntents: ["safety-violation"],
      capabilities
    };
  }

  // 2. Master Agent is unrestricted
  if (
    config.category === "master" ||
    config.uiType === "master" ||
    config.id === "agent-101" ||
    config.agent_id === "agent-101"
  ) {
    return { allowed: true, decision: DecisionType.ALLOW, reason: "master-agent" };
  }

  // 3. Ultra-vague or incomplete prompt check -> CLARIFY
  const words = normalizedTask.split(" ").filter(Boolean);
  if (words.length <= 4 && (
    normalizedTask === "do something" ||
    normalizedTask === "do something with this" ||
    normalizedTask === "help me" ||
    normalizedTask === "do this" ||
    normalizedTask === "start"
  )) {
    return {
      allowed: false,
      decision: DecisionType.CLARIFY,
      reason: "ambiguous-request",
      clarificationPrompt: "Sure! I can help with that. Could you please clarify what specific task or analysis you would like me to perform?",
      detectedIntents: [],
      capabilities
    };
  }

  // 4. Specialization & Plausible Relevance matching
  const agentName = normalize(config.name || "");
  const agentId = config.id || config.agent_id || "";

  // Check direct capability phrases in config.capabilities
  for (const cap of capabilities) {
    const phrase = normalize(cap).replace(/[-_]+/g, " ");
    if (matchesPhrase(normalizedTask, phrase)) {
      return { allowed: true, decision: DecisionType.ALLOW, reason: "capability-match" };
    }
    const parts = phrase.split(" ");
    if (parts.length > 1 && parts.every(p => matchesPhrase(normalizedTask, p))) {
      return { allowed: true, decision: DecisionType.ALLOW, reason: "capability-match" };
    }
  }

  // Check specialized tokens from capabilities and agent name
  const tokens = getCapabilityTokens(capabilities, agentName);
  for (const t of tokens) {
    if (GENERIC_VERBS.has(t)) continue;
    if (matchesPhrase(normalizedTask, t)) {
      return { allowed: true, decision: DecisionType.ALLOW, reason: "capability-match" };
    }
    for (const word of words) {
      if (word.length >= 4 && t.length >= 4 && (word.startsWith(t) || t.startsWith(word))) {
        return { allowed: true, decision: DecisionType.ALLOW, reason: "capability-match" };
      }
    }
  }

  // Social media platform entity matching
  if ((agentName.includes("social") || capabilities.some(c => c.includes("social"))) && (
    normalizedTask.includes("@") ||
    matchesPhrase(normalizedTask, "instagram") ||
    matchesPhrase(normalizedTask, "twitter") ||
    matchesPhrase(normalizedTask, "linkedin") ||
    matchesPhrase(normalizedTask, "facebook") ||
    matchesPhrase(normalizedTask, "tiktok")
  )) {
    return { allowed: true, decision: DecisionType.ALLOW, reason: "capability-match" };
  }

  // 5. Check if another specialist domain is a strong match (ROUTING)
  for (const dom of GLOBAL_DOMAIN_TAXONOMY) {
    for (const kw of dom.keywords) {
      if (matchesPhrase(normalizedTask, kw)) {
        return {
          allowed: false,
          decision: DecisionType.ROUTE,
          reason: "better-agent-available",
          recommendedAgent: {
            id: dom.agent_id,
            name: dom.name,
            category: dom.category,
            domain: dom.domain
          },
          detectedIntents: [dom.domain],
          capabilities
        };
      }
    }
  }

  // 6. Benign / Conversational Fallback -> ALLOW
  if (words.length >= 2 && !matchesPhrase(normalizedTask, "capital of") && !matchesPhrase(normalizedTask, "weather in")) {
    return {
      allowed: true,
      decision: DecisionType.ALLOW,
      reason: "plausible-relevance-fallback"
    };
  }

  // 7. Clearly Unrelated Request -> REJECT
  return {
    allowed: false,
    decision: DecisionType.REJECT,
    reason: "unrelated-request",
    detectedIntents: [],
    capabilities
  };
}

export function buildCapabilityError(config, gate = {}) {
  const capabilityText =
    Array.isArray(config.capabilities) && config.capabilities.length
      ? config.capabilities.join(", ")
      : "specialized tasks";

  let friendlyMessage = "";

  if (gate.reason === "safety-policy-violation") {
    friendlyMessage = "I cannot fulfill this request as it violates platform safety and authorization policies.";
  } else if (gate.decision === DecisionType.ROUTE && gate.recommendedAgent) {
    friendlyMessage = `Sorry, this request is outside my area of specialization. It appears better suited for the ${gate.recommendedAgent.name} (${gate.recommendedAgent.category}). Please consult that specialized agent instead.`;
  } else if (gate.decision === DecisionType.CLARIFY) {
    friendlyMessage = gate.clarificationPrompt || `Sure! I can help with that. Could you please clarify what specific task or analysis you would like me to perform?`;
  } else {
    friendlyMessage = `Sorry, this request is outside my area of specialization. As the ${config.name || "Specialist Agent"}, I specialize in ${capabilityText}. Please use the appropriate specialist for this task.`;
  }

  return {
    code: "AGENT_CAPABILITY_MISMATCH",
    message: friendlyMessage,
    decision: gate.decision || DecisionType.REJECT,
    agent_id: config.id || config.agent_id,
    agent_name: config.name,
    capabilities: config.capabilities,
    recommended_agent: gate.recommendedAgent || null,
    detected_intents: gate.detectedIntents || []
  };
}
