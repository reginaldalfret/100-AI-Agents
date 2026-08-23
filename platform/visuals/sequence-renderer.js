/**
 * Sovereign AI Workbench — Sequence Diagram SVG Renderer
 * Renders lifelines, synchronous/asynchronous calls, return paths, and activations in Liquid Glass style.
 */

import { DiagramSanitizer } from './sanitizer.js';
import { ThemeTokens } from './schema.js';

export class SequenceRenderer {
  /**
   * Renders a sequence diagram specification to SVG.
   */
  static render(spec) {
    const title = DiagramSanitizer.sanitizeLabel(spec.title || 'Sequence Flow');
    const actors = Array.isArray(spec.actors) ? spec.actors : [];
    const messages = Array.isArray(spec.messages) ? spec.messages : [];

    if (actors.length === 0) {
      return `<svg viewBox="0 0 400 80" xmlns="http://www.w3.org/2000/svg"><text x="200" y="45" fill="${ThemeTokens.textMuted}" text-anchor="middle">No sequence actors defined</text></svg>`;
    }

    const actorWidth = 130;
    const actorHeight = 36;
    const actorGap = 50;
    const msgGap = 42;

    const totalWidth = Math.max(500, 60 + actors.length * (actorWidth + actorGap));
    const totalHeight = 80 + actorHeight + messages.length * msgGap + 50;

    const actorPositions = new Map();
    actors.forEach((act, idx) => {
      const id = typeof act === 'string' ? act : (act.id || act.name);
      const name = typeof act === 'string' ? act : (act.name || act.id);
      const x = 50 + idx * (actorWidth + actorGap) + actorWidth / 2;
      actorPositions.set(String(id), { x, name });
    });

    let svg = `<svg viewBox="0 0 ${totalWidth} ${totalHeight}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="liquid-sequence" style="max-width:100%;font-family:Inter,system-ui,sans-serif;">`;

    svg += `
      <defs>
        <linearGradient id="seqActor" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgba(30, 41, 59, 0.9)" />
          <stop offset="100%" stop-color="rgba(15, 23, 42, 0.8)" />
        </linearGradient>
        <marker id="seqArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="${ThemeTokens.cyan}" />
        </marker>
        <marker id="seqReturn" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="${ThemeTokens.violet}" />
        </marker>
      </defs>
    `;

    // Title
    svg += `<text x="24" y="28" fill="${ThemeTokens.text}" font-size="15" font-weight="700">${title}</text>`;

    const startY = 55;
    const endY = totalHeight - 30;

    // Render Actor Boxes & Lifelines
    actors.forEach((act) => {
      const id = typeof act === 'string' ? act : (act.id || act.name);
      const pos = actorPositions.get(String(id));
      if (!pos) return;

      const actName = DiagramSanitizer.sanitizeLabel(pos.name);

      // Lifeline
      svg += `<line x1="${pos.x}" y1="${startY + actorHeight}" x2="${pos.x}" y2="${endY}" stroke="rgba(99, 102, 241, 0.3)" stroke-width="1.2" stroke-dasharray="5,5" />`;

      // Header Actor Box
      svg += `
        <rect x="${pos.x - actorWidth / 2}" y="${startY}" width="${actorWidth}" height="${actorHeight}" rx="8" fill="url(#seqActor)" stroke="rgba(99, 102, 241, 0.4)" stroke-width="1" />
        <text x="${pos.x}" y="${startY + 22}" fill="${ThemeTokens.text}" font-size="11" font-weight="600" text-anchor="middle">${actName}</text>
      `;
    });

    // Render Messages
    messages.forEach((msg, idx) => {
      const fromPos = actorPositions.get(String(msg.from || msg.source));
      const toPos = actorPositions.get(String(msg.to || msg.target));

      if (fromPos && toPos) {
        const y = startY + actorHeight + 25 + idx * msgGap;
        const isReturn = msg.type === 'return' || msg.style === 'dashed' || fromPos.x > toPos.x;
        const strokeColor = isReturn ? ThemeTokens.violet : ThemeTokens.cyan;
        const marker = isReturn ? 'url(#seqReturn)' : 'url(#seqArrow)';
        const textLabel = DiagramSanitizer.sanitizeLabel(msg.label || msg.text || '');

        const x1 = fromPos.x;
        const x2 = toPos.x > fromPos.x ? toPos.x - 6 : toPos.x + 6;

        svg += `
          <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${strokeColor}" stroke-width="1.6" stroke-dasharray="${isReturn ? '4,4' : 'none'}" marker-end="${marker}" opacity="0.9" />
          <text x="${(x1 + x2) / 2}" y="${y - 6}" fill="${ThemeTokens.textSecondary}" font-size="10" font-weight="500" text-anchor="middle">${textLabel}</text>
        `;
      }
    });

    svg += '</svg>';
    return svg;
  }
}
