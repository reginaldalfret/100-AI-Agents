/**
 * Sovereign AI Workbench — Diagram Schema & Data Validator
 * Validates specifications, bounds graph sizes, and ensures data integrity.
 */

import { VisualType } from './schema.js';

export class DiagramValidator {
  /**
   * Validates any visual specification object.
   */
  static validate(spec) {
    if (!spec || typeof spec !== 'object') {
      return { valid: false, error: 'Specification must be a valid non-null object.' };
    }

    const type = spec.type || spec.kind || VisualType.FLOWCHART;

    switch (type.toLowerCase()) {
      case VisualType.FLOWCHART:
      case VisualType.ARCHITECTURE:
      case VisualType.STATE:
      case VisualType.DECISION_TREE:
      case VisualType.MINDMAP:
      case VisualType.HIERARCHY:
        return this.validateGraphSpec(spec);

      case VisualType.SEQUENCE:
        return this.validateSequenceSpec(spec);

      case VisualType.TIMELINE:
        return this.validateTimelineSpec(spec);

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
        return this.validateChartSpec(spec);

      case VisualType.MERMAID:
        return this.validateMermaidSpec(spec);

      default:
        // Try fallback parsing if nodes/edges exist
        if (Array.isArray(spec.nodes) || Array.isArray(spec.edges)) {
          return this.validateGraphSpec(spec);
        }
        if (Array.isArray(spec.series) || Array.isArray(spec.data)) {
          return this.validateChartSpec(spec);
        }
        return { valid: false, error: `Unsupported diagram type: ${type}` };
    }
  }

  /**
   * Validates graph-based specs (nodes, edges, layers, groups).
   */
  static validateGraphSpec(spec) {
    const nodes = Array.isArray(spec.nodes) ? spec.nodes : [];
    const edges = Array.isArray(spec.edges) ? spec.edges : [];

    if (nodes.length === 0 && edges.length === 0) {
      return { valid: false, error: 'Graph must contain at least one node.' };
    }

    if (nodes.length > 60) {
      return { valid: false, error: `Node count (${nodes.length}) exceeds maximum allowable limit of 60 for local rendering.` };
    }

    const nodeIds = new Set();
    for (const node of nodes) {
      if (!node.id) {
        return { valid: false, error: 'Every node must have a unique non-empty id.' };
      }
      if (nodeIds.has(String(node.id))) {
        return { valid: false, error: `Duplicate node id found: ${node.id}` };
      }
      nodeIds.add(String(node.id));
    }

    // Validate edges
    for (const edge of edges) {
      if (!edge.from && !edge.source) {
        return { valid: false, error: 'Edge missing source/from node identifier.' };
      }
      if (!edge.to && !edge.target) {
        return { valid: false, error: 'Edge missing target/to node identifier.' };
      }
    }

    return { valid: true, type: spec.type || VisualType.FLOWCHART };
  }

  /**
   * Validates sequence diagram specs (actors, messages).
   */
  static validateSequenceSpec(spec) {
    const actors = Array.isArray(spec.actors) ? spec.actors : [];
    const messages = Array.isArray(spec.messages) ? spec.messages : [];

    if (actors.length === 0 && messages.length === 0) {
      return { valid: false, error: 'Sequence diagram must define actors or messages.' };
    }

    return { valid: true, type: VisualType.SEQUENCE };
  }

  /**
   * Validates timeline specs (events/milestones).
   */
  static validateTimelineSpec(spec) {
    const events = Array.isArray(spec.events) ? spec.events : (Array.isArray(spec.milestones) ? spec.milestones : []);
    if (events.length === 0) {
      return { valid: false, error: 'Timeline must have at least one event.' };
    }
    return { valid: true, type: VisualType.TIMELINE };
  }

  /**
   * Validates chart specs (series, data, numeric values).
   */
  static validateChartSpec(spec) {
    const type = spec.type || spec.kind || VisualType.BAR_CHART;
    const series = Array.isArray(spec.series) ? spec.series : [];
    const data = Array.isArray(spec.data) ? spec.data : [];

    if (type === VisualType.SCATTER_PLOT || type === VisualType.BUBBLE_CHART || type === 'scatter' || type === 'bubble') {
      for (const d of data) {
        if (typeof d.x !== 'number' || !Number.isFinite(d.x) || typeof d.y !== 'number' || !Number.isFinite(d.y)) {
          return { valid: false, error: 'Scatter/bubble chart requires finite numeric x and y values in data.' };
        }
      }
    } else if (type === VisualType.HISTOGRAM) {
      if (!Array.isArray(spec.bins) && !Array.isArray(spec.data)) {
        return { valid: false, error: 'Histogram requires bins or data array.' };
      }
    } else if (type === VisualType.RADAR_CHART || type === 'radar') {
      if (!Array.isArray(spec.axes) && !Array.isArray(spec.labels)) {
        return { valid: false, error: 'Radar chart requires axes or labels array.' };
      }
    } else if (type === VisualType.HEATMAP) {
      if (!Array.isArray(spec.matrix) || !spec.matrix.every(row => Array.isArray(row))) {
        return { valid: false, error: 'Heatmap requires a 2D array for matrix.' };
      }
    } else if (type === VisualType.BOX_PLOT) {
      for (const d of data) {
        if (d.min > d.q1 || d.q1 > d.median || d.median > d.q3 || d.q3 > d.max) {
          return { valid: false, error: 'Box plot requires min <= q1 <= median <= q3 <= max.' };
        }
      }
    } else {
      if (series.length === 0 && data.length === 0 && type !== VisualType.GAUGE_CHART && type !== 'gauge') {
        return { valid: false, error: 'Chart specification requires series or data arrays.' };
      }
    }

    // Ensure all numeric values are finite numbers (for general series/data)
    for (const s of series) {
      if (Array.isArray(s.values)) {
        for (const v of s.values) {
          if (typeof v !== 'number' || !Number.isFinite(v)) {
            return { valid: false, error: `Invalid chart value: ${v} (must be finite number)` };
          }
        }
      }
    }

    for (const d of data) {
      if (typeof d.value !== 'undefined' && (typeof d.value !== 'number' || !Number.isFinite(d.value))) {
        return { valid: false, error: `Invalid chart data point value: ${d.value}` };
      }
    }

    return { valid: true, type: spec.type || VisualType.BAR_CHART };
  }

  /**
   * Validates Mermaid syntax strings.
   */
  static validateMermaidSpec(spec) {
    const code = typeof spec === 'string' ? spec : (spec.code || spec.source || '');
    if (!code.trim()) {
      return { valid: false, error: 'Mermaid code cannot be empty.' };
    }
    const clean = code.trim().toLowerCase();
    const validMermaidHeaders = ['graph', 'flowchart', 'sequencediagram', 'statediagram', 'classdiagram', 'erdiagram', 'pie', 'gantt', 'mindmap', 'timeline', 'quadrantchart'];
    const hasHeader = validMermaidHeaders.some(h => clean.startsWith(h));
    if (!hasHeader) {
      return { valid: false, error: 'Invalid Mermaid header type.' };
    }
    return { valid: true, type: VisualType.MERMAID };
  }
}
