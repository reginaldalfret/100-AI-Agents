/**
 * Sovereign AI Workbench — Diagram Sanitizer & XSS Shield
 * Strips executable HTML, scripts, external URLs, and malicious characters.
 */

export class DiagramSanitizer {
  /**
   * Escapes HTML entities for safe SVG text nodes.
   */
  static escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Sanitizes text labels and attribute values.
   */
  static sanitizeLabel(label) {
    if (typeof label !== 'string') return '';
    // Strip control characters, script tags, event handlers, and dangerous protocols
    let clean = label
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/javascript\s*:/gi, '')
      .replace(/data\s*:\s*text\/html/gi, '')
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]*on\w+\s*=[^>]*>/gi, '')
      .replace(/on\w+\s*=\s*['"][^'"]*['"]/gi, '')
      .replace(/on\w+\s*=\s*[^\s>]+/gi, '')
      .trim();
    return this.escapeHtml(clean);
  }

  /**
   * Sanitizes an ID string so it's safe for SVG element IDs and CSS selectors.
   */
  static sanitizeId(id) {
    if (typeof id !== 'string') return `node_${Math.random().toString(36).slice(2, 8)}`;
    return id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  }

  /**
   * Sanitizes a color token or validates it against allowed theme colors.
   */
  static sanitizeColor(color, fallback = '#6366f1') {
    if (typeof color !== 'string') return fallback;
    const clean = color.trim();
    // Allow valid hex, rgb, rgba, hsl, hsla or var(--...)
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(clean)) return clean;
    if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)$/.test(clean)) return clean;
    if (/^var\(--[\w-]+\)$/.test(clean)) return clean;
    return fallback;
  }
}
