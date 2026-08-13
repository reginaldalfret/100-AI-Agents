const INTENT_RULES = [
  {
    capabilityPatterns: [
      "email",
      "professional-email",
      "business-email",
      "internship-email"
    ],
    keywords: [
      "email",
      "e-mail",
      "subject line",
      "email reply",
      "email response",
      "follow-up email",
      "internship inquiry",
      "internship application"
    ]
  },

  {
    capabilityPatterns: [
      "quiz",
      "mcq",
      "question-generation",
      "answer-key"
    ],
    keywords: [
      "quiz",
      "mcq",
      "multiple choice",
      "multiple-choice",
      "question bank",
      "answer key",
      "true or false",
      "true/false"
    ]
  },

  {
    capabilityPatterns: [
      "writing",
      "article-writing",
      "essay-writing",
      "creative-writing"
    ],
    keywords: [
      "write an essay",
      "write an article",
      "write a story",
      "creative writing",
      "essay",
      "article"
    ]
  },

  {
    capabilityPatterns: [
      "translation"
    ],
    keywords: [
      "translate",
      "translation",
      "translate this"
    ]
  },

  {
    capabilityPatterns: [
      "resume",
      "resume-writing",
      "resume-editing",
      "ats"
    ],
    keywords: [
      "resume",
      "résumé",
      "cv",
      "ats"
    ]
  },

  {
    capabilityPatterns: [
      "coding",
      "code-generation",
      "debugging",
      "code-review",
      "software-architecture",
      "full-stack"
    ],
    keywords: [
      "write code",
      "generate code",
      "debug",
      "debugging",
      "code review",
      "programming",
      "javascript",
      "python",
      "typescript",
      "react",
      "api endpoint"
    ]
  },

  {
    capabilityPatterns: [
      "research",
      "web-research",
      "news-research",
      "company-research",
      "market-research",
      "research-paper"
    ],
    keywords: [
      "research",
      "research this",
      "find information",
      "investigate",
      "compare companies",
      "market research",
      "latest news"
    ]
  }
];

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function matchesRule(task, rule) {
  return rule.keywords.some(keyword =>
    task.includes(normalize(keyword))
  );
}

function capabilityMatchesRule(capabilities, rule) {
  return capabilities.some(capability => {
    const normalized = normalize(capability);

    return rule.capabilityPatterns.some(pattern =>
      normalized.includes(normalize(pattern))
    );
  });
}

export function checkCapability(task, config) {
  const normalizedTask = normalize(task);
  const capabilities = Array.isArray(config.capabilities)
    ? config.capabilities
    : [];

  /*
   * Master/orchestrator agents are intentionally unrestricted.
   * Their job is to delegate rather than perform one narrow task.
   */
  if (
    config.category === "master" ||
    config.uiType === "master" ||
    config.id === "agent-101"
  ) {
    return {
      allowed: true,
      reason: "master-agent"
    };
  }

  /*
   * Every specialized agent must declare capabilities.
   *
   * An empty capability list is NOT treated as unrestricted.
   * Only the Master Agent is intentionally unrestricted.
   */
  if (capabilities.length === 0) {
    return {
      allowed: false,
      reason: "no-capability-policy",
      detectedIntents: [],
      capabilities
    };
  }

  const matchingRules = INTENT_RULES.filter(rule =>
    matchesRule(normalizedTask, rule)
  );

  /*
   * STRICT SPECIALIZATION POLICY
   *
   * If we cannot identify an intent that belongs to this
   * specialized agent, reject the request instead of sending
   * it to the model.
   *
   * This prevents specialized agents from behaving like
   * general-purpose chatbots.
   */
  if (matchingRules.length === 0) {
    return {
      allowed: false,
      reason: "unknown-or-out-of-scope",
      detectedIntents: [],
      capabilities
    };
  }

  /*
   * If at least one detected intent belongs to this agent's
   * capabilities, the request is allowed.
   */
  if (
    matchingRules.some(rule =>
      capabilityMatchesRule(capabilities, rule)
    )
  ) {
    return {
      allowed: true,
      reason: "capability-match"
    };
  }

  /*
   * A known intent was detected, but the current agent
   * does not advertise the required capability.
   */
  return {
    allowed: false,
    reason: "capability-mismatch",
    detectedIntents: matchingRules.map(rule =>
      rule.capabilityPatterns
    ).flat(),
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
