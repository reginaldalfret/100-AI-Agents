/**
 * Sovereign AI Workbench — Unified Diagrammatic Renderer & Error Boundary
 * Integrates all diagram formats into responsive, accessible, Liquid Glass cards.
 */

import { VisualType } from './schema.js';
import { DiagramValidator } from './validator.js';
import { DiagramSanitizer } from './sanitizer.js';
import { FlowchartRenderer } from './flowchart-renderer.js';
import { ArchitectureRenderer } from './architecture-renderer.js';
import { SequenceRenderer } from './sequence-renderer.js';
import { ChartRenderer } from './chart-renderer.js';
import { TimelineRenderer } from './timeline-renderer.js';
import { MermaidRenderer } from './mermaid-renderer.js';

export class DiagramRenderer {
  /**
   * Renders any specification object or Mermaid block safely into an interactive Liquid Glass card.
   * @param {Object|string} specOrCode
   * @param {Object} options - { cardId, title, allowExport, groundedSource }
   * @returns {string} HTML string containing the complete Liquid Glass diagram card.
   */
  static renderCard(specOrCode, options = {}) {
    const cardId = options.cardId || `diag_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const groundedSource = options.groundedSource || options.source || null;

    try {
      let type = VisualType.FLOWCHART;
      let svgContent = '';
      let rawSource = '';

      if (typeof specOrCode === 'string') {
        rawSource = specOrCode.trim();
        type = VisualType.MERMAID;
        svgContent = MermaidRenderer.render(rawSource);
      } else if (typeof specOrCode === 'object' && specOrCode !== null) {
        rawSource = JSON.stringify(specOrCode, null, 2);
        type = specOrCode.type || VisualType.FLOWCHART;

        const validation = DiagramValidator.validate(specOrCode);
        if (!validation.valid) {
          return this.renderErrorCard(cardId, validation.error, rawSource);
        }

        switch (type.toLowerCase()) {
          case VisualType.FLOWCHART:
          case VisualType.MINDMAP:
          case VisualType.HIERARCHY:
          case VisualType.DECISION_TREE:
          case VisualType.STATE:
            svgContent = FlowchartRenderer.render(specOrCode);
            break;

          case VisualType.ARCHITECTURE:
            svgContent = ArchitectureRenderer.render(specOrCode);
            break;

          case VisualType.SEQUENCE:
            svgContent = SequenceRenderer.render(specOrCode);
            break;

          case VisualType.TIMELINE:
            svgContent = TimelineRenderer.render(specOrCode);
            break;

          case VisualType.BAR_CHART:
          case VisualType.LINE_CHART:
          case VisualType.PIE_CHART:
          case VisualType.AREA_CHART:
          case VisualType.DONUT_CHART:
          case VisualType.HORIZONTAL_BAR_CHART:
          case VisualType.GROUPED_BAR_CHART:
          case VisualType.STACKED_BAR_CHART:
          case VisualType.HISTOGRAM:
          case VisualType.SCATTER_PLOT:
          case VisualType.STACKED_AREA_CHART:
          case VisualType.BUBBLE_CHART:
          case VisualType.RADAR_CHART:
          case VisualType.HEATMAP:
          case VisualType.BOX_PLOT:
          case VisualType.WATERFALL_CHART:
          case VisualType.GAUGE_CHART:
          case VisualType.POPULATION_PYRAMID:
          case 'chart':
            svgContent = ChartRenderer.render(specOrCode);
            break;

          case VisualType.MERMAID:
            svgContent = MermaidRenderer.render(specOrCode.code || specOrCode.source || '');
            break;

          default:
            svgContent = FlowchartRenderer.render(specOrCode);
            break;
        }
      }

      const displayTitle = DiagramSanitizer.sanitizeLabel(
        options.title || specOrCode?.title || `${type.toUpperCase()} Diagram`
      );

      const sourceBadgeHtml = groundedSource
        ? `<div class="diagram-source-tag">📄 Source: ${DiagramSanitizer.sanitizeLabel(groundedSource)}</div>`
        : '';

      return `
        <div class="liquid-diagram-card" id="${cardId}" role="region" aria-label="${displayTitle}">
          <div class="diagram-card-header">
            <div class="diagram-card-title">
              <span class="diagram-sparkle">✦</span>
              <span>${displayTitle}</span>
              <span class="diagram-type-pill">${type.toUpperCase()}</span>
            </div>
            <div class="diagram-card-actions">
              <button class="diag-btn" title="Copy Diagram Source" onclick="window.copyDiagramSource && window.copyDiagramSource('${cardId}')">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                <span>Source</span>
              </button>
              <button class="diag-btn" title="Export SVG" onclick="window.exportDiagramSvg && window.exportDiagramSvg('${cardId}')">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                <span>SVG</span>
              </button>
              <button class="diag-btn primary" title="Expand Fullscreen" onclick="window.expandDiagram && window.expandDiagram('${cardId}')">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                <span>Expand</span>
              </button>
            </div>
          </div>
          <div class="diagram-svg-viewport">
            ${svgContent}
          </div>
          ${sourceBadgeHtml}
          <div class="diagram-raw-source" style="display:none;" data-source="${encodeURIComponent(rawSource)}"></div>
        </div>
      `;
    } catch (err) {
      return this.renderErrorCard(cardId, err.message, String(specOrCode));
    }
  }

  /**
   * Fallback error card when specification fails validation or rendering.
   */
  static renderErrorCard(cardId, errorMessage, rawSource = '') {
    const cleanErr = DiagramSanitizer.sanitizeLabel(errorMessage);
    return `
      <div class="liquid-diagram-card error-card" id="${cardId}">
        <div class="diagram-card-header">
          <div class="diagram-card-title" style="color:var(--neon-red,#ef4444);">
            <span>⚠ Diagram Rendering Notice</span>
          </div>
        </div>
        <div style="padding:14px 18px;font-size:12px;color:var(--text-secondary,#94a3b8);line-height:1.6;">
          <p style="margin:0 0 8px 0;color:var(--text-primary,#f1f5f9);">The visual diagram could not be rendered automatically (${cleanErr}).</p>
          <p style="margin:0;font-size:11px;">A full textual explanation has been provided below.</p>
        </div>
      </div>
    `;
  }
}
