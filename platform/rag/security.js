/**
 * Sovereign AI Workbench — RAG Security & Air-Gap Egress Guard
 * Enforces zero data exfiltration, prompt injection defense, untrusted document isolation,
 * path traversal protection, and strict rejection of external cloud endpoints.
 *
 * 100% On-Premise, Air-Gapped, Zero External Calls.
 */

import path from 'node:path';

export const INJECTION_PATTERNS = [
  { name: 'INSTRUCTION_OVERRIDE', pattern: /ignore\s+(all\s+)?(previous|prior)\s+instructions/i },
  { name: 'SYSTEM_PROMPT_EXTRACTION', pattern: /(reveal|print|output|show)\s+(the\s+)?(system\s+prompt|initial\s+instructions)/i },
  { name: 'ROLE_HIJACK', pattern: /you\s+are\s+now\s+(in\s+)?(developer\s+mode|dan|jailbreak|unrestricted)/i },
  { name: 'XML_DELIMITER_INJECTION', pattern: /<\/?(source_evidence|system|im_start|im_end|prompt)>/i },
  { name: 'CODE_EVAL_INJECTION', pattern: /\b(eval\s*\(|exec\s*\(|Function\s*\()/i },
  { name: 'SOVEREIGN_POLICY_OVERRIDE', pattern: /disregard\s+(sovereign|security|safety)\s+(policy|rules)/i }
];

export class RAGSecurityGuard {
  constructor(options = {}) {
    this.allowedHosts = new Set(['127.0.0.1', 'localhost', '::1', '0.0.0.0']);
    this.allowedRoot = options.allowedRoot ? path.resolve(options.allowedRoot) : null;
  }

  /**
   * Scans text for prompt injection attempts and dangerous control characters.
   * @param {string} text 
   * @returns {Object} { safe: boolean, threats: Array, sanitizedText: string }
   */
  inspectAndSanitize(text) {
    if (!text || typeof text !== 'string') {
      return { safe: true, threats: [], sanitizedText: text || '' };
    }

    const threats = [];
    let sanitizedText = text;

    for (const { name, pattern } of INJECTION_PATTERNS) {
      if (pattern.test(text)) {
        threats.push({
          threatType: name,
          match: text.match(pattern)[0]
        });
        sanitizedText = sanitizedText.replace(pattern, `[SECURITY_SHIELD: ${name}_NEUTRALIZED]`);
      }
    }

    // Escape raw XML/HTML boundary markers
    sanitizedText = sanitizedText
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return {
      safe: threats.length === 0,
      threats,
      sanitizedText
    };
  }

  /**
   * Evaluates network endpoint for sovereign air-gapped compliance.
   * Rejects any external or non-loopback URLs.
   * @param {string} endpointUrl 
   * @returns {Object} { allowed: boolean, reason: string, isAirGapped: boolean }
   */
  validateEgressEndpoint(endpointUrl) {
    if (!endpointUrl || typeof endpointUrl !== 'string') {
      return { allowed: false, reason: 'Invalid or missing endpoint URL', isAirGapped: false };
    }

    try {
      const parsed = new URL(endpointUrl);
      const hostname = parsed.hostname.toLowerCase();

      if (this.allowedHosts.has(hostname)) {
        return {
          allowed: true,
          reason: `Local sovereign loopback endpoint (${hostname}) authorized.`,
          isAirGapped: true
        };
      }

      return {
        allowed: false,
        reason: `SOVEREIGN_VIOLATION: Remote cloud host '${hostname}' is rejected under air-gap policy.`,
        isAirGapped: false
      };
    } catch {
      return {
        allowed: false,
        reason: `Malformed endpoint URL: '${endpointUrl}'`,
        isAirGapped: false
      };
    }
  }

  /**
   * Validates document file path to prevent directory traversal attacks.
   * @param {string} filePath 
   * @param {string} [baseDir] 
   * @returns {Object} { valid: boolean, resolvedPath: string, error?: string }
   */
  validateFilePath(filePath, baseDir = null) {
    if (!filePath || typeof filePath !== 'string') {
      return { valid: false, resolvedPath: null, error: 'Path must be a non-empty string' };
    }

    // Check directory traversal attempts
    if (filePath.includes('../') || filePath.includes('..\\')) {
      const resolved = path.resolve(filePath);
      const root = baseDir ? path.resolve(baseDir) : (this.allowedRoot || process.cwd());
      if (!resolved.startsWith(root)) {
        return {
          valid: false,
          resolvedPath: resolved,
          error: `PATH_TRAVERSAL_DETECTED: Path '${filePath}' attempts to escape authorized root.`
        };
      }
    }

    const resolved = path.resolve(filePath);
    return {
      valid: true,
      resolvedPath: resolved
    };
  }
}

export const ragSecurityGuard = new RAGSecurityGuard();
