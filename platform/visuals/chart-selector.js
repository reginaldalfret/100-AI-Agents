/**
 * Sovereign AI Workbench — Automatic Chart Selection Engine
 * Analyzes natural language intent and tabular/data shape to select the optimal chart.
 */

import { VisualType } from './schema.js';
import { CHART_REGISTRY } from './registry.js';

export class ChartSelector {
  /**
   * Automatically determines the optimal visual representation.
   * @param {Object} options { prompt, data, schema }
   * @returns {Object} { recommendedType, confidence, reason }
   */
  static selectChart(options = {}) {
    const { prompt = '', data = null, columns = [] } = options;
    const p = prompt.toLowerCase().trim();

    // 1. Direct explicit intent overrides
    if (p.includes('horizontal bar') || p.includes('hbar') || p.includes('horizontal rank')) {
      return { recommendedType: VisualType.HORIZONTAL_BAR_CHART, confidence: 0.98, reason: 'Explicit horizontal bar request.' };
    }
    if (p.includes('grouped bar') || p.includes('clustered bar')) {
      return { recommendedType: VisualType.GROUPED_BAR_CHART, confidence: 0.98, reason: 'Explicit grouped bar request.' };
    }
    if (p.includes('stacked bar')) {
      return { recommendedType: VisualType.STACKED_BAR_CHART, confidence: 0.98, reason: 'Explicit stacked bar request.' };
    }
    if (p.includes('bar chart') || p.includes('column chart') || p.includes('barchart') || p.includes('bar graph')) {
      return { recommendedType: VisualType.BAR_CHART, confidence: 0.95, reason: 'Explicit bar chart request.' };
    }
    if (p.includes('line chart') || p.includes('line graph') || p.includes('trend chart') || p.includes('time series')) {
      return { recommendedType: VisualType.LINE_CHART, confidence: 0.95, reason: 'Explicit line chart request.' };
    }
    if (p.includes('histogram') || p.includes('frequency distribution') || p.includes('distribution of')) {
      return { recommendedType: VisualType.HISTOGRAM, confidence: 0.95, reason: 'Explicit histogram / distribution request.' };
    }
    if (p.includes('scatter plot') || p.includes('scatter') || p.includes('correlation between') || p.includes('xy plot')) {
      return { recommendedType: VisualType.SCATTER_PLOT, confidence: 0.95, reason: 'Explicit scatter plot / correlation request.' };
    }
    if (p.includes('bubble chart') || p.includes('3d scatter')) {
      return { recommendedType: VisualType.BUBBLE_CHART, confidence: 0.95, reason: 'Explicit bubble chart request.' };
    }
    if (p.includes('box plot') || p.includes('box and whisker') || p.includes('quartile')) {
      return { recommendedType: VisualType.BOX_PLOT, confidence: 0.95, reason: 'Explicit box plot request.' };
    }
    if (p.includes('heatmap') || p.includes('heat map') || p.includes('correlation matrix')) {
      return { recommendedType: VisualType.HEATMAP, confidence: 0.95, reason: 'Explicit heatmap matrix request.' };
    }
    if (p.includes('radar chart') || p.includes('spider chart') || p.includes('multivariate comparison')) {
      return { recommendedType: VisualType.RADAR_CHART, confidence: 0.95, reason: 'Explicit radar chart request.' };
    }
    if (p.includes('waterfall') || p.includes('bridge chart') || p.includes('cumulative variance')) {
      return { recommendedType: VisualType.WATERFALL_CHART, confidence: 0.95, reason: 'Explicit waterfall chart request.' };
    }
    if (p.includes('donut chart') || p.includes('donut')) {
      return { recommendedType: VisualType.DONUT_CHART, confidence: 0.95, reason: 'Explicit donut chart request.' };
    }
    if (p.includes('pie chart') || p.includes('pie') || p.includes('market share') || p.includes('share of')) {
      return { recommendedType: VisualType.PIE_CHART, confidence: 0.95, reason: 'Explicit pie chart request.' };
    }
    if (p.includes('gauge') || p.includes('speedometer') || p.includes('meter')) {
      return { recommendedType: VisualType.GAUGE_CHART, confidence: 0.95, reason: 'Explicit gauge request.' };
    }
    if (p.includes('timeline') || p.includes('milestones') || p.includes('roadmap')) {
      return { recommendedType: VisualType.TIMELINE, confidence: 0.95, reason: 'Explicit timeline request.' };
    }
    if (p.includes('flowchart') || p.includes('process flow') || p.includes('workflow map')) {
      return { recommendedType: VisualType.FLOWCHART, confidence: 0.95, reason: 'Explicit flowchart request.' };
    }
    if (p.includes('architecture') || p.includes('system design') || p.includes('subsystem')) {
      return { recommendedType: VisualType.ARCHITECTURE, confidence: 0.95, reason: 'Explicit architecture request.' };
    }
    if (p.includes('sequence diagram') || p.includes('sequence lifeline')) {
      return { recommendedType: VisualType.SEQUENCE, confidence: 0.95, reason: 'Explicit sequence diagram request.' };
    }

    // 2. Data Shape Analysis
    if (data && typeof data === 'object') {
      // 2a. Check if matrix (2D array)
      if (data.matrix && Array.isArray(data.matrix) && data.matrix.length > 0 && Array.isArray(data.matrix[0])) {
        return { recommendedType: VisualType.HEATMAP, confidence: 0.9, reason: 'Data structure is a 2D matrix.' };
      }

      // 2b. Check if XY numeric pairs
      if (Array.isArray(data) && data.length > 0 && typeof data[0].x === 'number' && typeof data[0].y === 'number') {
        if (data[0].size != null || data[0].r != null) {
          return { recommendedType: VisualType.BUBBLE_CHART, confidence: 0.92, reason: 'Data points contain (x, y, size) numeric tuples.' };
        }
        return { recommendedType: VisualType.SCATTER_PLOT, confidence: 0.92, reason: 'Data points contain (x, y) numeric coordinate pairs.' };
      }

      // 2c. Check if Box plot stats (min, q1, median, q3, max)
      if (Array.isArray(data) && data.length > 0 && data[0].median != null && data[0].q1 != null && data[0].q3 != null) {
        return { recommendedType: VisualType.BOX_PLOT, confidence: 0.95, reason: 'Data structure contains 5-number quartile distribution.' };
      }

      // 2d. Check if waterfall steps
      if (Array.isArray(data) && data.length > 0 && (data[0].type === 'increase' || data[0].type === 'decrease' || data[0].type === 'total')) {
        return { recommendedType: VisualType.WATERFALL_CHART, confidence: 0.95, reason: 'Data contains sequential positive/negative variance steps.' };
      }

      // 2e. Check date/time series
      const isDateSeries = (labels = []) => labels.some(l => /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|202\d|201\d|q[1-4]|week|month|day)/i.test(String(l)));
      if (data.labels && isDateSeries(data.labels)) {
        if (data.series && data.series.length > 1) {
          return { recommendedType: VisualType.LINE_CHART, confidence: 0.88, reason: 'Multi-series time/date progression.' };
        }
        return { recommendedType: VisualType.LINE_CHART, confidence: 0.85, reason: 'Sequential time/date series.' };
      }

      // 2f. Proportions / Percentages totaling ~100
      if (Array.isArray(data) && data.length >= 2 && data.length <= 7) {
        const sum = data.reduce((acc, d) => acc + (typeof d.value === 'number' ? d.value : 0), 0);
        if (Math.abs(sum - 100) < 1.0 || data.every(d => typeof d.label === 'string' && d.label.toLowerCase().includes('%'))) {
          return { recommendedType: VisualType.PIE_CHART, confidence: 0.85, reason: 'Small discrete categorical parts of a 100% total.' };
        }
      }

      // 2g. Multiple series category comparison
      if (data.categories && data.series && data.series.length > 1) {
        return { recommendedType: VisualType.GROUPED_BAR_CHART, confidence: 0.85, reason: 'Multi-series categorical comparison.' };
      }
    }

    // 3. Fallback deterministic rule
    if (p.includes('compare') || p.includes('comparison') || p.includes('versus') || p.includes('vs')) {
      return { recommendedType: VisualType.BAR_CHART, confidence: 0.8, reason: 'Comparison intent matches categorical bar chart.' };
    }
    if (p.includes('trend') || p.includes('change') || p.includes('over time') || p.includes('growth')) {
      return { recommendedType: VisualType.LINE_CHART, confidence: 0.8, reason: 'Trend intent matches line chart.' };
    }

    // Default general-purpose comparison
    return { recommendedType: VisualType.BAR_CHART, confidence: 0.75, reason: 'Default robust categorical comparison.' };
  }
}
