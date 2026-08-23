/**
 * Sovereign AI Workbench — Flowchart & Process Pipeline SVG Renderer
 * Produces crisp, responsive, Liquid Glass styled SVGs with gradient connectors and node badges.
 */

import { DiagramSanitizer } from './sanitizer.js';
import { ThemeTokens, NodeKind } from './schema.js';

export class FlowchartRenderer {
  /**
   * Renders a validated flowchart specification to an SVG string.
   */
  static render(spec) {
    const title = DiagramSanitizer.sanitizeLabel(spec.title || 'Process Flowchart');
    const nodes = Array.isArray(spec.nodes) ? spec.nodes : [];
    const edges = Array.isArray(spec.edges) ? spec.edges : [];
    const direction = (spec.direction || 'TB').toUpperCase();

    if (nodes.length === 0) {
      return `<svg viewBox="0 0 400 80" xmlns="http://www.w3.org/2000/svg"><text x="200" y="45" fill="${ThemeTokens.textMuted}" text-anchor="middle" font-size="14">No flowchart nodes provided</text></svg>`;
    }

    const nodeWidth = 190;
    const nodeHeight = 58;
    const gapY = 54;
    const gapX = 60;

    // Automatic layout calculation (Vertical TB or Horizontal LR)
    const isTB = direction !== 'LR';
    const nodePositions = new Map();

    nodes.forEach((node, idx) => {
      const x = isTB ? 200 : 40 + idx * (nodeWidth + gapX);
      const y = isTB ? 50 + idx * (nodeHeight + gapY) : 90;
      nodePositions.set(String(node.id), { x, y, node });
    });

    const totalWidth = isTB ? 400 : Math.max(500, 80 + nodes.length * (nodeWidth + gapX));
    const totalHeight = isTB ? Math.max(160, 100 + nodes.length * (nodeHeight + gapY)) : 220;

    let svg = `<svg viewBox="0 0 ${totalWidth} ${totalHeight}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="liquid-flowchart" style="max-width:100%;font-family:Inter,system-ui,sans-serif;">`;

    // Definitions: Gradients, Filters, Markers
    svg += `
      <defs>
        <linearGradient id="flowGlass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgba(30, 41, 59, 0.85)" />
          <stop offset="100%" stop-color="rgba(15, 23, 42, 0.75)" />
        </linearGradient>
        <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${ThemeTokens.indigo}" />
          <stop offset="100%" stop-color="${ThemeTokens.cyan}" />
        </linearGradient>
        <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${ThemeTokens.cyan}" />
          <stop offset="50%" stop-color="${ThemeTokens.violet}" />
          <stop offset="100%" stop-color="${ThemeTokens.magenta}" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="${ThemeTokens.cyan}" />
        </marker>
      </defs>
    `;

    // Title if present
    if (title) {
      svg += `<text x="20" y="28" fill="${ThemeTokens.text}" font-size="14" font-weight="600" letter-spacing="0.3">${title}</text>`;
    }

    // Render Edges
    edges.forEach((edge, i) => {
      const fromPos = nodePositions.get(String(edge.from || edge.source));
      const toPos = nodePositions.get(String(edge.to || edge.target));

      if (fromPos && toPos) {
        const startX = fromPos.x;
        const startY = fromPos.y + (isTB ? nodeHeight / 2 : 0);
        const endX = toPos.x;
        const endY = toPos.y - (isTB ? nodeHeight / 2 : 0);

        const edgeLabel = DiagramSanitizer.sanitizeLabel(edge.label || '');

        if (isTB) {
          const midY = (startY + endY) / 2;
          svg += `<path d="M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY - 6}" fill="none" stroke="url(#edgeGrad)" stroke-width="2" stroke-dasharray="${edge.style === 'dashed' ? '4,4' : 'none'}" marker-end="url(#arrowhead)" opacity="0.9" />`;

          if (edgeLabel) {
            svg += `
              <rect x="${(startX + endX) / 2 - 40}" y="${midY - 10}" width="80" height="18" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(99,102,241,0.2)" stroke-width="0.8" />
              <text x="${(startX + endX) / 2}" y="${midY + 3}" fill="${ThemeTokens.textSecondary}" font-size="10" text-anchor="middle" font-weight="500">${edgeLabel}</text>
            `;
          }
        } else {
          const startX_LR = fromPos.x + nodeWidth / 2;
          const endX_LR = toPos.x - nodeWidth / 2;
          svg += `<path d="M ${startX_LR} ${fromPos.y} L ${endX_LR - 6} ${toPos.y}" fill="none" stroke="url(#edgeGrad)" stroke-width="2" marker-end="url(#arrowhead)" opacity="0.9" />`;
          if (edgeLabel) {
            svg += `
              <rect x="${(startX_LR + endX_LR) / 2 - 35}" y="${fromPos.y - 18}" width="70" height="16" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(99,102,241,0.2)" stroke-width="0.8" />
              <text x="${(startX_LR + endX_LR) / 2}" y="${fromPos.y - 6}" fill="${ThemeTokens.textSecondary}" font-size="10" text-anchor="middle">${edgeLabel}</text>
            `;
          }
        }
      }
    });

    // Render Nodes
    nodes.forEach((node, idx) => {
      const pos = nodePositions.get(String(node.id));
      if (!pos) return;

      const label = DiagramSanitizer.sanitizeLabel(node.label || node.id);
      const subLabel = DiagramSanitizer.sanitizeLabel(node.subLabel || node.subtitle || '');
      const kind = (node.kind || NodeKind.DEFAULT).toLowerCase();

      let borderGrad = 'rgba(99, 102, 241, 0.4)';
      let badgeColor = ThemeTokens.indigo;

      if (kind === NodeKind.START || kind === 'input' || kind === 'client') {
        borderGrad = 'rgba(6, 182, 212, 0.5)';
        badgeColor = ThemeTokens.cyan;
      } else if (kind === NodeKind.END || kind === 'success') {
        borderGrad = 'rgba(16, 185, 129, 0.5)';
        badgeColor = ThemeTokens.success;
      } else if (kind === NodeKind.AGENT || kind === 'orchestrator') {
        borderGrad = 'rgba(139, 92, 246, 0.6)';
        badgeColor = ThemeTokens.violet;
      } else if (kind === NodeKind.DECISION) {
        borderGrad = 'rgba(245, 158, 11, 0.6)';
        badgeColor = ThemeTokens.warning;
      }

      const rectX = pos.x - nodeWidth / 2;
      const rectY = pos.y - nodeHeight / 2;

      svg += `
        <g class="flow-node" id="node_${DiagramSanitizer.sanitizeId(node.id)}" transform="translate(${rectX}, ${rectY})">
          <!-- Glass Box Base -->
          <rect x="0" y="0" width="${nodeWidth}" height="${nodeHeight}" rx="12" fill="url(#flowGlass)" stroke="${borderGrad}" stroke-width="1.2" />
          
          <!-- Top glowing edge -->
          <line x1="12" y1="0" x2="${nodeWidth - 12}" y2="0" stroke="${badgeColor}" stroke-width="1.5" opacity="0.75" />

          <!-- Step number badge -->
          <rect x="10" y="${nodeHeight / 2 - 9}" width="18" height="18" rx="9" fill="rgba(99, 102, 241, 0.2)" stroke="${badgeColor}" stroke-width="0.8" />
          <text x="19" y="${nodeHeight / 2 + 4}" fill="${ThemeTokens.text}" font-size="10" font-weight="700" text-anchor="middle">${idx + 1}</text>

          <!-- Label -->
          <text x="36" y="${subLabel ? nodeHeight / 2 - 2 : nodeHeight / 2 + 4}" fill="${ThemeTokens.text}" font-size="12" font-weight="600">${label}</text>
          ${subLabel ? `<text x="36" y="${nodeHeight / 2 + 13}" fill="${ThemeTokens.textSecondary}" font-size="10">${subLabel}</text>` : ''}
        </g>
      `;
    });

    svg += '</svg>';
    return svg;
  }
}
