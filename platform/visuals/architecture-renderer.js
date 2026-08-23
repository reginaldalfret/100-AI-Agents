/**
 * Sovereign AI Workbench — Architecture Diagram SVG Renderer
 * Renders multi-tiered system components, security boundaries, and data paths in Liquid Glass style.
 */

import { DiagramSanitizer } from './sanitizer.js';
import { ThemeTokens } from './schema.js';

export class ArchitectureRenderer {
  /**
   * Renders a system architecture specification to a layered SVG.
   */
  static render(spec) {
    const title = DiagramSanitizer.sanitizeLabel(spec.title || 'System Architecture');
    const description = DiagramSanitizer.sanitizeLabel(spec.description || '');
    const nodes = Array.isArray(spec.nodes) ? spec.nodes : [];
    const edges = Array.isArray(spec.edges) ? spec.edges : [];

    // Group nodes by layer/tier
    const layersMap = new Map();
    nodes.forEach(n => {
      const layerName = n.layer || n.tier || 'Core Services';
      if (!layersMap.has(layerName)) layersMap.set(layerName, []);
      layersMap.get(layerName).push(n);
    });

    const layerNames = Array.from(layersMap.keys());
    const layerHeight = 110;
    const cardWidth = 175;
    const cardHeight = 56;
    const cardGap = 20;

    let maxNodesInLayer = 1;
    layersMap.forEach(list => {
      if (list.length > maxNodesInLayer) maxNodesInLayer = list.length;
    });

    const totalWidth = Math.max(680, 80 + maxNodesInLayer * (cardWidth + cardGap));
    const totalHeight = 80 + layerNames.length * layerHeight + 40;

    let svg = `<svg viewBox="0 0 ${totalWidth} ${totalHeight}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="liquid-architecture" style="max-width:100%;font-family:Inter,system-ui,sans-serif;">`;

    svg += `
      <defs>
        <linearGradient id="archLayerBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgba(17, 24, 39, 0.6)" />
          <stop offset="100%" stop-color="rgba(15, 23, 42, 0.4)" />
        </linearGradient>
        <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgba(30, 41, 59, 0.85)" />
          <stop offset="100%" stop-color="rgba(15, 23, 42, 0.75)" />
        </linearGradient>
        <linearGradient id="neonGlow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${ThemeTokens.cyan}" />
          <stop offset="100%" stop-color="${ThemeTokens.violet}" />
        </linearGradient>
        <marker id="archArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="${ThemeTokens.violet}" />
        </marker>
      </defs>
    `;

    // Title & Subtitle Header
    svg += `
      <text x="24" y="32" fill="${ThemeTokens.text}" font-size="16" font-weight="700" letter-spacing="0.4">${title}</text>
      ${description ? `<text x="24" y="52" fill="${ThemeTokens.textSecondary}" font-size="11">${description}</text>` : ''}
    `;

    const nodePositions = new Map();

    // Render Layers & Cards
    layerNames.forEach((layerName, layerIdx) => {
      const layerY = 70 + layerIdx * layerHeight;
      const layerNodes = layersMap.get(layerName);
      const layerWidth = totalWidth - 48;

      // Layer Boundary Box
      svg += `
        <g class="arch-layer" transform="translate(24, ${layerY})">
          <rect x="0" y="0" width="${layerWidth}" height="${layerHeight - 16}" rx="14" fill="url(#archLayerBg)" stroke="rgba(99, 102, 241, 0.2)" stroke-width="1" />
          <rect x="14" y="-8" width="${Math.max(120, layerName.length * 8 + 20)}" height="18" rx="4" fill="rgba(15, 23, 42, 0.95)" stroke="rgba(99, 102, 241, 0.3)" stroke-width="0.8" />
          <text x="24" y="5" fill="${ThemeTokens.cyan}" font-size="10" font-weight="600" text-transform="uppercase" letter-spacing="0.6">${DiagramSanitizer.sanitizeLabel(layerName)}</text>
        </g>
      `;

      // Render Nodes inside layer
      const totalCardsWidth = layerNodes.length * cardWidth + (layerNodes.length - 1) * cardGap;
      const startX = 24 + (layerWidth - totalCardsWidth) / 2;

      layerNodes.forEach((node, nodeIdx) => {
        const cardX = startX + nodeIdx * (cardWidth + cardGap);
        const cardY = layerY + 18;
        nodePositions.set(String(node.id), { x: cardX + cardWidth / 2, y: cardY + cardHeight / 2 });

        const label = DiagramSanitizer.sanitizeLabel(node.name || node.label || node.id);
        const role = DiagramSanitizer.sanitizeLabel(node.role || node.subtitle || '');
        const badge = DiagramSanitizer.sanitizeLabel(node.badge || '');

        svg += `
          <g class="arch-card" transform="translate(${cardX}, ${cardY})">
            <rect x="0" y="0" width="${cardWidth}" height="${cardHeight}" rx="10" fill="url(#cardGrad)" stroke="rgba(99, 102, 241, 0.35)" stroke-width="1" />
            <line x1="8" y1="0" x2="${cardWidth - 8}" y2="0" stroke="${ThemeTokens.indigo}" stroke-width="1.5" opacity="0.8" />
            
            <text x="12" y="22" fill="${ThemeTokens.text}" font-size="12" font-weight="600">${label}</text>
            ${role ? `<text x="12" y="38" fill="${ThemeTokens.textSecondary}" font-size="10">${role}</text>` : ''}
            
            ${badge ? `
              <rect x="${cardWidth - 62}" y="${cardHeight - 16}" width="54" height="12" rx="3" fill="rgba(99, 102, 241, 0.2)" stroke="${ThemeTokens.violet}" stroke-width="0.5" />
              <text x="${cardWidth - 35}" y="${cardHeight - 7}" fill="${ThemeTokens.violet}" font-size="8" font-weight="600" text-anchor="middle">${badge}</text>
            ` : ''}
          </g>
        `;
      });
    });

    // Render Inter-layer Connecting Edges
    edges.forEach((edge) => {
      const fromPos = nodePositions.get(String(edge.from || edge.source));
      const toPos = nodePositions.get(String(edge.to || edge.target));

      if (fromPos && toPos) {
        const startX = fromPos.x;
        const startY = fromPos.y + cardHeight / 2;
        const endX = toPos.x;
        const endY = toPos.y - cardHeight / 2;
        const midY = (startY + endY) / 2;

        svg += `
          <path d="M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY - 4}" fill="none" stroke="${ThemeTokens.violet}" stroke-width="1.5" stroke-dasharray="${edge.style === 'dashed' ? '4,4' : 'none'}" marker-end="url(#archArrow)" opacity="0.65" />
        `;
      }
    });

    svg += '</svg>';
    return svg;
  }
}
