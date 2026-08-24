/**
 * Sovereign AI Workbench — Diagram & Visual Specification Schemas
 */

export const VisualType = {
  // Comparison
  BAR_CHART: 'bar_chart',
  HORIZONTAL_BAR_CHART: 'horizontal_bar_chart',
  GROUPED_BAR_CHART: 'grouped_bar_chart',
  STACKED_BAR_CHART: 'stacked_bar_chart',
  
  // Trend
  LINE_CHART: 'line_chart',
  AREA_CHART: 'area_chart',
  STACKED_AREA_CHART: 'stacked_area_chart',
  
  // Distribution
  HISTOGRAM: 'histogram',
  BOX_PLOT: 'box_plot',
  
  // Relationship
  SCATTER_PLOT: 'scatter_plot',
  BUBBLE_CHART: 'bubble_chart',
  
  // Composition
  PIE_CHART: 'pie_chart',
  DONUT_CHART: 'donut_chart',
  WATERFALL_CHART: 'waterfall_chart',
  
  // Matrix
  HEATMAP: 'heatmap',
  RADAR_CHART: 'radar_chart',
  
  // KPI / Statistical
  GAUGE_CHART: 'gauge_chart',
  KPI_CARD: 'kpi_card',
  POPULATION_PYRAMID: 'population_pyramid',
  
  // Time / Process
  TIMELINE: 'timeline',
  GANTT: 'gantt',
  
  // Structural
  FLOWCHART: 'flowchart',
  ARCHITECTURE: 'architecture',
  SEQUENCE: 'sequence',
  STATE: 'state',
  MINDMAP: 'mindmap',
  HIERARCHY: 'hierarchy',
  DECISION_TREE: 'decision_tree',
  NETWORK_GRAPH: 'network_graph',
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
  DATA: 'data',
  SERVICE: 'service',
  GATEWAY: 'gateway',
  MODEL: 'model',
  AGENT: 'agent',
  STORAGE: 'storage',
  EVIDENCE: 'evidence',
  SECURITY: 'security',
  CLIENT: 'client'
};
