/**
 * 301 SUPER AI — Personal Style Data Pipeline: PII Filter
 * Provides deterministic masking and redaction of personally identifiable information (PII):
 * Phone numbers, emails, URLs, IP addresses, and specific physical location landmarks.
 */

// Phone numbers: Indian 10-digit formats with or without +91 / 91 prefixes, spaced or hyphenated,
// plus general standard international/domestic numbers
export const PHONE_REGEX = /(?:\+?91[\s\-]?)?(?:[6-9]\d{4}[\s\-]?\d{5}|[6-9]\d{9})|(?:\+?\d{1,3}[\s\-]?)?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}/g;

// Email addresses conforming to standard internet email syntax
export const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// URLs (http, https, ftp, or standard domain links like forms.gle, share.google)
export const URL_REGEX = /(?:https?:\/\/|ftp:\/\/|www\.)[^\s/$.?#].[^\s]*|(?:https?:\/\/)?(?:forms\.gle|share\.google|bit\.ly|t\.co)\/[a-zA-Z0-9_-]+/gi;

// IPv4 Addresses
export const IP_REGEX = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;

// Specific private physical landmarks mentioned in governance docs
export const LOCATION_REGEX = /\b(Vanagram|Koyambedu|Perambur|Anna Nagar|T\.?\s*Nagar|Mogappair)\b/gi;

export const REDACTION_TOKENS = {
  PHONE: "[PHONE_REDACTED]",
  EMAIL: "[EMAIL_REDACTED]",
  URL: "[URL_REDACTED]",
  IP: "[IP_REDACTED]",
  LOCATION: "[LOCATION_REDACTED]"
};

/**
 * Deterministically masks all PII entities in the given text.
 * 
 * @param {string} text - Input text
 * @param {Object} [options] - Custom tokens or selective masking flags
 * @returns {string} Sanitized string with PII replaced by deterministic tokens
 */
export function maskPII(text, options = {}) {
  if (!text || typeof text !== "string") return text || "";

  const tokens = { ...REDACTION_TOKENS, ...(options.tokens || {}) };

  let sanitized = text;

  // 1. Mask URLs first to prevent email or number confusion inside URLs
  if (options.maskUrls !== false) {
    sanitized = sanitized.replace(URL_REGEX, tokens.URL);
  }

  // 2. Mask Email addresses
  if (options.maskEmails !== false) {
    sanitized = sanitized.replace(EMAIL_REGEX, tokens.EMAIL);
  }

  // 3. Mask Phone numbers
  if (options.maskPhones !== false) {
    sanitized = sanitized.replace(PHONE_REGEX, tokens.PHONE);
  }

  // 4. Mask IP addresses
  if (options.maskIps !== false) {
    sanitized = sanitized.replace(IP_REGEX, tokens.IP);
  }

  // 5. Mask sensitive physical landmarks
  if (options.maskLocations !== false) {
    sanitized = sanitized.replace(LOCATION_REGEX, tokens.LOCATION);
  }

  return sanitized;
}

/**
 * Detects if a text contains any unmasked PII entities.
 * 
 * @param {string} text - Input text
 * @returns {boolean} True if any raw PII pattern matches
 */
export function hasPII(text) {
  if (!text || typeof text !== "string") return false;

  // Clone regexes for stateful regex testing
  return (
    new RegExp(EMAIL_REGEX.source, "i").test(text) ||
    new RegExp(URL_REGEX.source, "i").test(text) ||
    new RegExp(PHONE_REGEX.source).test(text) ||
    new RegExp(LOCATION_REGEX.source, "i").test(text)
  );
}

/**
 * Extracts and categorizes all detected PII occurrences.
 * 
 * @param {string} text - Input text
 * @returns {Object} Detected entities grouped by type
 */
export function detectPII(text) {
  if (!text || typeof text !== "string") {
    return { phones: [], emails: [], urls: [], locations: [], hasAny: false };
  }

  const phones = Array.from(text.match(new RegExp(PHONE_REGEX.source, "g")) || []);
  const emails = Array.from(text.match(new RegExp(EMAIL_REGEX.source, "gi")) || []);
  const urls = Array.from(text.match(new RegExp(URL_REGEX.source, "gi")) || []);
  const locations = Array.from(text.match(new RegExp(LOCATION_REGEX.source, "gi")) || []);

  const hasAny = phones.length > 0 || emails.length > 0 || urls.length > 0 || locations.length > 0;

  return { phones, emails, urls, locations, hasAny };
}

/**
 * Audits an entire dataset for unredacted PII leaks.
 * 
 * @param {Array<Object>} dataset - Array of `{ messages: [...] }`
 * @param {Array<string>} [knownSensitiveTerms] - Known raw PII terms (e.g. phone numbers, emails)
 * @returns {Object} Audit result { clean: boolean, leakCount: number, leaks: Array }
 */
export function auditDatasetForPII(dataset, knownSensitiveTerms = ["80981", "dheerajkothari01@gmail.com", "Vanagram"]) {
  let leakCount = 0;
  const leaks = [];

  for (let i = 0; i < dataset.length; i++) {
    const item = dataset[i];
    const msgs = item.messages || [];
    for (const m of msgs) {
      const content = m.content || "";

      // Check known forbidden terms
      for (const term of knownSensitiveTerms) {
        if (content.toLowerCase().includes(term.toLowerCase())) {
          leakCount++;
          leaks.push({ index: i, role: m.role, matchedTerm: term, snippet: content.slice(0, 50) });
        }
      }

      // Check unmasked raw emails
      if (new RegExp(EMAIL_REGEX.source, "i").test(content)) {
        leakCount++;
        leaks.push({ index: i, role: m.role, pattern: "RAW_EMAIL", snippet: content.slice(0, 50) });
      }
    }
  }

  return {
    clean: leakCount === 0,
    leakCount,
    leaks
  };
}
