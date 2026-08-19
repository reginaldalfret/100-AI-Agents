const GLOBAL_INTENT_DOMAINS = [
  {
    domain: "email",
    keywords: ["email", "e-mail", "subject line", "inbox", "outbox", "mail draft", "internship inquiry", "newsletter email"],
    patterns: ["email", "email-writing", "email-reply", "professional-email"]
  },
  {
    domain: "quiz",
    keywords: ["quiz", "mcq", "multiple choice", "multiple-choice", "question bank", "trivia", "answer key"],
    patterns: ["quiz", "mcq", "question-generation", "exam-prep"]
  },
  {
    domain: "writing",
    keywords: ["essay", "article", "story", "creative writing", "blog post", "draft manuscript", "narrative", "poem", "script"],
    patterns: ["writing", "article-writing", "essay-writing", "creative-writing", "copywriting"]
  },
  {
    domain: "summarization",
    keywords: ["summarize", "summary", "tldr", "synopsis", "key takeaways", "executive summary", "condense this"],
    patterns: ["summarization", "text-summarization", "book-summarization", "briefing"]
  },
  {
    domain: "translation",
    keywords: ["translate", "translation", "spanish", "french", "german", "mandarin", "hindi", "multilingual"],
    patterns: ["translation", "language-translation", "localization"]
  },
  {
    domain: "resume",
    keywords: ["resume", "résumé", "cv", "curriculum vitae", "ats score", "ats optimization", "job application"],
    patterns: ["resume", "resume-writing", "resume-editing", "career-advisor", "ats"]
  },
  {
    domain: "coding",
    keywords: ["javascript", "python", "typescript", "react", "c++", "rust", "algorithm", "pull request", "refactor code", "debug code", "dockerfile", "sql query", "api endpoint", "full stack"],
    patterns: ["coding", "code-generation", "debugging", "code-review", "full-stack", "devops", "docker", "ci-cd", "database"]
  },
  {
    domain: "research",
    keywords: ["research paper", "arxiv", "literature review", "web research", "fact check", "citation", "competitor analysis", "market report", "swot analysis"],
    patterns: ["research", "web-research", "paper-analysis", "market-research", "fact-checking"]
  },
  {
    domain: "business_finance",
    keywords: ["financial analysis", "balance sheet", "income statement", "roi", "accounting", "ledger", "invoice", "ebitda", "cash flow", "budget"],
    patterns: ["finance", "financial-analysis", "accounting", "invoice-processing", "business-analyst"]
  }
];

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function checkCapability(task, config) {
  const normalizedTask = normalize(task);
  const capabilities = Array.isArray(config.capabilities) ? config.capabilities : [];

  // 1. Master agent is unrestricted
  if (
    config.category === "master" ||
    config.uiType === "master" ||
    config.id === "agent-101" ||
    config.agent_id === "agent-101"
  ) {
    return { allowed: true, reason: "master-agent" };
  }

  // 2. Specialized agents must declare capabilities
  if (capabilities.length === 0) {
    return {
      allowed: false,
      reason: "no-capability-policy",
      detectedIntents: [],
      capabilities
    };
  }

  // 3. Direct matching against agent's own declared capabilities & name keywords
  const agentTokens = new Set();
  const agentNameTokens = normalize(config.name || "").split(" ");
  for (const t of agentNameTokens) {
    if (t && t !== "ai" && t !== "agent") agentTokens.add(t);
  }

  const GENERIC_TOKENS = new Set(["ai", "agent", "write", "writ", "generate", "genera", "create", "creat", "plan", "build", "help", "make", "task", "work", "tool", "assist"]);

  for (const cap of capabilities) {
    const parts = normalize(cap).split(/[-_\s]+/);
    for (const p of parts) {
      if (p.length > 2) {
        agentTokens.add(p);
        if (p.endsWith("ing") && p.length > 5) agentTokens.add(p.slice(0, -3));
        if (p.endsWith("tion") && p.length > 6) agentTokens.add(p.slice(0, -4));
        if (p.endsWith("zation") && p.length > 7) agentTokens.add(p.slice(0, -6));
        if (p.endsWith("sation") && p.length > 7) agentTokens.add(p.slice(0, -6));
        if (p.endsWith("ment") && p.length > 6) agentTokens.add(p.slice(0, -4));
        if (p.endsWith("sis") && p.length > 5) agentTokens.add(p.slice(0, -3));
        if (p.endsWith("er") && p.length > 4) agentTokens.add(p.slice(0, -2));
      }
    }
  }

  // Check if task matches full capability phrases or specific capability tokens
  const taskWords = normalizedTask.split(/\s+/);
  let matchesOwnCapability = false;

  for (const cap of capabilities) {
    const phrase = normalize(cap).replace(/[-_]+/g, " ");
    if (normalizedTask.includes(phrase)) {
      matchesOwnCapability = true;
      break;
    }
  }

  if (!matchesOwnCapability) {
    for (const token of agentTokens) {
      if (GENERIC_TOKENS.has(token) && !agentNameTokens.includes(token)) continue;
      if (normalizedTask.includes(token)) {
        matchesOwnCapability = true;
        break;
      }
      for (const tw of taskWords) {
        if (tw.length >= 4 && (tw.startsWith(token) || token.startsWith(tw))) {
          matchesOwnCapability = true;
          break;
        }
      }
      if (matchesOwnCapability) break;
    }
  }

  if (matchesOwnCapability) {
    return {
      allowed: true,
      reason: "capability-match"
    };
  }

  // 4. Check if task matches any other known domain
  const foreignDomains = GLOBAL_INTENT_DOMAINS.filter(dom => {
    return dom.keywords.some(k => normalizedTask.includes(k));
  });

  if (foreignDomains.length > 0) {
    return {
      allowed: false,
      reason: "capability-mismatch",
      detectedIntents: foreignDomains.map(d => d.domain),
      capabilities
    };
  }

  // 5. Out of scope / unrecognized
  return {
    allowed: false,
    reason: "unknown-or-out-of-scope",
    detectedIntents: [],
    capabilities
  };
}

export function buildCapabilityError(config, gate) {
  const capabilityText =
    Array.isArray(config.capabilities) &&
    config.capabilities.length
      ? config.capabilities.join(", ")
      : "specialized tasks";

  return {
    code: "AGENT_CAPABILITY_MISMATCH",
    message:
      `I'm sorry, but I'm the ${config.name}. ` +
      `I specialize in: ${capabilityText}. ` +
      `This request appears to be outside my specialization. ` +
      `Please use the appropriate specialized agent for this task.`,
    agent_id: config.id,
    agent_name: config.name,
    capabilities: config.capabilities,
    detected_intents: gate.detectedIntents || []
  };
}
