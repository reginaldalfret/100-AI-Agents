/**
 * Sovereign AI Workbench — Diagram Export Engine
 * Exports rendered SVG / Canvas diagrams to SVG, PNG, and JPEG.
 * Server-side utilities and shared constants for both Node.js and browser contexts.
 */

/**
 * Solid dark background for JPEG exports (no transparency).
 * Matches the Liquid Glass dark theme.
 */
const JPG_BACKGROUND_COLOR = '#0b1120';

/**
 * Default high-DPI scale factor for raster exports.
 */
const DEFAULT_EXPORT_SCALE = 2;

/**
 * Default JPEG quality (0.0–1.0).
 */
const DEFAULT_JPEG_QUALITY = 0.93;

export class DiagramExporter {
  /** Background color for JPEG exports */
  static JPG_BACKGROUND_COLOR = JPG_BACKGROUND_COLOR;

  /** Default pixel scale for PNG/JPG export */
  static DEFAULT_EXPORT_SCALE = DEFAULT_EXPORT_SCALE;

  /** Default JPEG quality */
  static DEFAULT_JPEG_QUALITY = DEFAULT_JPEG_QUALITY;

  /**
   * Generates a downloadable SVG Data URL.
   */
  static exportSvgDataUrl(svgString) {
    if (typeof svgString !== 'string') return '';
    const encoded = encodeURIComponent(svgString);
    return `data:image/svg+xml;charset=utf-8,${encoded}`;
  }

  /**
   * Generates a descriptive, slugified filename for export.
   * @param {string} title - Diagram/chart title
   * @param {string} visualType - e.g. 'bar_chart', 'flowchart', 'architecture'
   * @param {string} format - 'png', 'jpg', 'jpeg', or 'svg'
   * @returns {string} e.g. 'monthly-sales-bar-chart.png'
   */
  static generateExportFilename(title, visualType, format) {
    // Normalize format
    let ext = (format || 'png').toLowerCase().trim();
    if (ext === 'jpeg') ext = 'jpg';
    if (!['png', 'jpg', 'svg'].includes(ext)) ext = 'png';

    // Slugify title
    let slug = (title || '').toLowerCase()
      .replace(/[''""]/g, '')                    // Remove quotes
      .replace(/[^a-z0-9\s-]/g, ' ')            // Replace special chars with space
      .replace(/\s+/g, '-')                      // Spaces to hyphens
      .replace(/-+/g, '-')                       // Collapse multiple hyphens
      .replace(/^-|-$/g, '');                    // Trim leading/trailing hyphens

    // Slugify visual type
    let typeSlug = (visualType || '').toLowerCase()
      .replace(/_/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Build filename
    if (slug && typeSlug) {
      // Avoid redundancy: if title already contains the type, skip it
      if (slug.includes(typeSlug) || slug.includes(typeSlug.replace('-chart', ''))) {
        return `${slug}.${ext}`;
      }
      return `${slug}-${typeSlug}.${ext}`;
    }
    if (slug) return `${slug}.${ext}`;
    if (typeSlug) return `${typeSlug}.${ext}`;
    return `visual-export.${ext}`;
  }

  /**
   * Extracts viewBox dimensions from an SVG string.
   * @param {string} svgString
   * @returns {{ width: number, height: number }}
   */
  static extractSvgDimensions(svgString) {
    const vbMatch = (svgString || '').match(/viewBox\s*=\s*["']([^"']+)["']/);
    if (vbMatch) {
      const parts = vbMatch[1].trim().split(/[\s,]+/).map(Number);
      if (parts.length >= 4 && isFinite(parts[2]) && isFinite(parts[3])) {
        return { width: parts[2], height: parts[3] };
      }
    }
    // Fallback: try width/height attributes
    const wMatch = (svgString || '').match(/width\s*=\s*["'](\d+)/);
    const hMatch = (svgString || '').match(/height\s*=\s*["'](\d+)/);
    return {
      width: wMatch ? parseInt(wMatch[1], 10) : 600,
      height: hMatch ? parseInt(hMatch[1], 10) : 400
    };
  }

  /**
   * Triggers a browser download for any Blob or Data URL.
   */
  static downloadFile(filename, dataUrl) {
    if (typeof document === 'undefined') return;
    const a = document.createElement('a');
    a.download = filename;
    a.href = dataUrl;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * Downloads a Blob directly (preferred for PNG/JPG).
   */
  static downloadBlob(filename, blob) {
    if (typeof document === 'undefined') return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = filename;
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}
