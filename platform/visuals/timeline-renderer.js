/**
 * Sovereign AI Workbench — Timeline & Milestone SVG Renderer
 * Renders chronological event paths and milestones in Liquid Glass style.
 */

import { DiagramSanitizer } from './sanitizer.js';
import { ThemeTokens } from './schema.js';

export class TimelineRenderer {
  /**
   * Renders a timeline specification to an SVG string.
   */
  static render(spec) {
    const title = DiagramSanitizer.sanitizeLabel(spec.title || 'Project Timeline');
    const events = Array.isArray(spec.events) ? spec.events : (Array.isArray(spec.milestones) ? spec.milestones : []);

    if (events.length === 0) {
      return `<svg viewBox="0 0 400 80" xmlns="http://www.w3.org/2000/svg"><text x="200" y="45" fill="${ThemeTokens.textMuted}" text-anchor="middle">No timeline events provided</text></svg>`;
    }

    const eventHeight = 65;
    const totalWidth = 580;
    const totalHeight = 80 + events.length * eventHeight + 20;
    const axisX = 70;

    let svg = `<svg viewBox="0 0 ${totalWidth} ${totalHeight}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="liquid-timeline" style="max-width:100%;font-family:Inter,system-ui,sans-serif;">`;
    svg += `<text x="24" y="28" fill="${ThemeTokens.text}" font-size="15" font-weight="700">${title}</text>`;

    // Vertical Timeline Axis
    const startY = 60;
    const endY = startY + (events.length - 1) * eventHeight;
    svg += `
      <line x1="${axisX}" y1="${startY}" x2="${axisX}" y2="${endY}" stroke="rgba(99, 102, 241, 0.35)" stroke-width="2" />
    `;

    const palette = [ThemeTokens.cyan, ThemeTokens.violet, ThemeTokens.magenta, ThemeTokens.success, ThemeTokens.warning];

    events.forEach((ev, idx) => {
      const y = startY + idx * eventHeight;
      const date = DiagramSanitizer.sanitizeLabel(ev.date || ev.time || ev.year || `Step ${idx + 1}`);
      const eventTitle = DiagramSanitizer.sanitizeLabel(ev.title || ev.label || ev.name || '');
      const desc = DiagramSanitizer.sanitizeLabel(ev.description || ev.details || '');
      const color = palette[idx % palette.length];

      svg += `
        <!-- Milestone Dot -->
        <circle cx="${axisX}" cy="${y}" r="6" fill="${color}" stroke="#0f172a" stroke-width="2" />
        
        <!-- Milestone Date / Time -->
        <text x="${axisX - 16}" y="${y + 4}" fill="${ThemeTokens.cyan}" font-size="10" font-weight="600" text-anchor="end">${date}</text>
        
        <!-- Event Card -->
        <g transform="translate(${axisX + 24}, ${y - 20})">
          <rect x="0" y="0" width="${totalWidth - axisX - 48}" height="44" rx="8" fill="rgba(30, 41, 59, 0.75)" stroke="rgba(99, 102, 241, 0.25)" stroke-width="1" />
          <text x="12" y="18" fill="${ThemeTokens.text}" font-size="11" font-weight="600">${eventTitle}</text>
          ${desc ? `<text x="12" y="32" fill="${ThemeTokens.textSecondary}" font-size="9">${desc}</text>` : ''}
        </g>
      `;
    });

    svg += '</svg>';
    return svg;
  }
}
