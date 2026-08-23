/**
 * Sovereign AI Workbench — Diagram & Visual Specification Schemas
 * Standardizes definitions for flowcharts, architecture diagrams, sequence lifelines,
 * timelines, state machines, and data charts.
 */

export const VisualType = {
  FLOWCHART: 'flowchart',
  ARCHITECTURE: 'architecture',
  SEQUENCE: 'sequence',
  STATE: 'state',
  TIMELINE: 'timeline',
  MINDMAP: 'mindmap',
  HIERARCHY: 'hierarchy',
  DECISION_TREE: 'decision_tree',
  BAR_CHART: 'bar_chart',
  LINE_CHART: 'line_chart',
  PIE_CHART: 'pie_chart',
  AREA_CHART: 'area_chart',
  DONUT_CHART: 'donut_chart',
  HORIZONTAL_BAR_CHART: 'horizontal_bar_chart',
  GROUPED_BAR_CHART: 'grouped_bar_chart',
  STACKED_BAR_CHART: 'stacked_bar_chart',
  HISTOGRAM: 'histogram',
  SCATTER_PLOT: 'scatter_plot',
  STACKED_AREA_CHART: 'stacked_area_chart',
  BUBBLE_CHART: 'bubble_chart',
  RADAR_CHART: 'radar_chart',
  HEATMAP: 'heatmap',
  BOX_PLOT: 'box_plot',
  WATERFALL_CHART: 'waterfall_chart',
  GAUGE_CHART: 'gauge_chart',
  POPULATION_PYRAMID: 'population_pyramid',
  MERMAID: 'mermaid'
};

export const ThemeTokens = {
  bg: 'rgba(17, 24, 39, 0.75)',
  glass: 'rgba(26, 31, 46, 0.65)',
  border: 'rgba(99, 102, 241, 0.25)',
  borderActive: 'rgba(99, 102, 241, 0.6)',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  cyan: '#06b6d4',
  violet: '#8b5cf6',
  magenta: '#d946ef',
  blue: '#3b82f6',
  indigo: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444'
};

export const NodeKind = {
  DEFAULT: 'default',
  START: 'start',
  END: 'end',
  PROCESS: 'process',
  DECISION: 'decision',
  AGENT: 'agent',
  MODEL: 'model',
  DATABASE: 'database',
  STORAGE: 'storage',
  GATEWAY: 'gateway',
  CLIENT: 'client',
  SECURITY: 'security',
  EVIDENCE: 'evidence'
};
