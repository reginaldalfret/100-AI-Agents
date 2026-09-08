/**
 * 301 SUPER AI — Personal Style Data Pipeline: Sensitive Content Filter
 * Filters out conversational turns containing:
 * 1. Trauma disclosures / acute psychological distress
 * 2. Self-harm / suicidal ideation
 * 3. Explicit / NSFW / non-consensual sexual content
 * 4. Financial credentials / OTPs / passwords
 * 
 * In accordance with the 301 SUPER AI Governance Charter, sensitive dialogue turns
 * are completely EXCLUDED from training corpora rather than merely masked.
 */

export const SENSITIVE_CATEGORIES = {
  TRAUMA_DISCLOSURE: "TRAUMA_DISCLOSURE",
  SELF_HARM: "SELF_HARM",
  EXPLICIT_CONTENT: "EXPLICIT_CONTENT",
  FINANCIAL_CREDENTIALS: "FINANCIAL_CREDENTIALS"
};

// Targeted regex patterns for each category
export const SENSITIVE_PATTERNS = {
  [SENSITIVE_CATEGORIES.TRAUMA_DISCLOSURE]: [
    /\b(acute trauma|ptsd breakdown|mental breakdown|abused as a child|domestic violence|severe panic attack)\b/i,
    /\b(trauma disclosure|psychological abuse|clinical trauma|grief trauma|traumatized me)\b/i
  ],
  [SENSITIVE_CATEGORIES.SELF_HARM]: [
    /\b(suicide|suicidal|kill myself|end my life|slit (?:my )?wrists?|want to die|commit suicide|self-harm|cutting myself)\b/i,
    /\b(hang myself|overdose on pills|jumping off a bridge|die alone)\b/i
  ],
  [SENSITIVE_CATEGORIES.EXPLICIT_CONTENT]: [
    /\b(nude photos?|send nudes|sex tape|nsfw video|explicit porn|pornographic content|hardcore sex)\b/i,
    /\b(sexual assault|sexual harassment|unwanted sexual advances)\b/i
  ],
  [SENSITIVE_CATEGORIES.FINANCIAL_CREDENTIALS]: [
    /\b(otp is \d{4,6}|cvv \d{3,4}|netbanking password|upi pin \d{4,6}|atm pin \d{4})\b/i,
    /\b(bank account number:\s*\d+|credit card cvv)\b/i
  ]
};

/**
 * Classifies a text string against sensitive content categories.
 * 
 * @param {string} text - Text to analyze
 * @returns {Object} Classification result { isSensitive: boolean, categories: string[], matchedPatterns: string[] }
 */
export function classifySensitiveContent(text) {
  if (!text || typeof text !== "string") {
    return { isSensitive: false, categories: [], matchedPatterns: [] };
  }

  const categories = [];
  const matchedPatterns = [];

  for (const [category, patterns] of Object.entries(SENSITIVE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        if (!categories.includes(category)) {
          categories.push(category);
        }
        matchedPatterns.push(pattern.source);
      }
    }
  }

  return {
    isSensitive: categories.length > 0,
    categories,
    matchedPatterns
  };
}

/**
 * Checks whether a text contains sensitive content.
 * 
 * @param {string} text 
 * @returns {boolean}
 */
export function isSensitiveText(text) {
  return classifySensitiveContent(text).isSensitive;
}

/**
 * Filters an array of conversational turns, excluding any turn that touches upon
 * trauma, self-harm, explicit content, or financial secrets.
 * 
 * @param {Array<Object>} turns - Array of conversational turns `{ messages: [...] }`
 * @returns {Object} `{ cleanTurns: Array, excludedTurns: Array, stats: Object }`
 */
export function filterSensitiveTurns(turns) {
  const cleanTurns = [];
  const excludedTurns = [];
  const categoryCounts = {
    [SENSITIVE_CATEGORIES.TRAUMA_DISCLOSURE]: 0,
    [SENSITIVE_CATEGORIES.SELF_HARM]: 0,
    [SENSITIVE_CATEGORIES.EXPLICIT_CONTENT]: 0,
    [SENSITIVE_CATEGORIES.FINANCIAL_CREDENTIALS]: 0
  };

  for (const turn of turns) {
    const msgs = turn.messages || [];
    let isExcluded = false;
    const detectedCategories = [];

    for (const msg of msgs) {
      const result = classifySensitiveContent(msg.content);
      if (result.isSensitive) {
        isExcluded = true;
        for (const cat of result.categories) {
          if (!detectedCategories.includes(cat)) {
            detectedCategories.push(cat);
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
          }
        }
      }
    }

    if (isExcluded) {
      excludedTurns.push({
        turn,
        reasons: detectedCategories
      });
    } else {
      cleanTurns.push(turn);
    }
  }

  return {
    cleanTurns,
    excludedTurns,
    stats: {
      totalInput: turns.length,
      retainedCount: cleanTurns.length,
      excludedCount: excludedTurns.length,
      exclusionRate: turns.length > 0 ? (excludedTurns.length / turns.length) : 0,
      breakdown: categoryCounts
    }
  };
}

/**
 * Validates that a dataset has zero occurrences of prohibited sensitive categories.
 * 
 * @param {Array<Object>} dataset - List of `{ messages: [...] }`
 * @param {Array<string>} [prohibitedCategories] - Specific categories to forbid (defaults to all)
 * @returns {Object} `{ passed: boolean, violations: Array }`
 */
export function auditDatasetForSensitiveContent(dataset, prohibitedCategories = null) {
  const targetCategories = prohibitedCategories || Object.values(SENSITIVE_CATEGORIES);
  const violations = [];

  for (let i = 0; i < dataset.length; i++) {
    const item = dataset[i];
    const msgs = item.messages || [];
    for (const m of msgs) {
      const res = classifySensitiveContent(m.content);
      const offending = res.categories.filter(c => targetCategories.includes(c));
      if (offending.length > 0) {
        violations.push({
          index: i,
          role: m.role,
          categories: offending,
          snippet: (m.content || "").slice(0, 60)
        });
      }
    }
  }

  return {
    passed: violations.length === 0,
    violationCount: violations.length,
    violations
  };
}
