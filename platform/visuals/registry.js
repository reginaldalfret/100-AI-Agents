/**
 * Sovereign AI Workbench — Authoritative Visual Type Registry
 */

import { VisualType } from './schema.js';

export const CHART_REGISTRY = {
  [VisualType.BAR_CHART]: {
    id: VisualType.BAR_CHART,
    category: 'Comparison',
    name: 'Vertical Bar Chart',
    aliases: ['bar', 'column_chart', 'barchart'],
    requiredFields: ['categories|labels', 'series|data'],
    description: 'Compares discrete categorical values along a vertical scale.'
  },
  [VisualType.HORIZONTAL_BAR_CHART]: {
    id: VisualType.HORIZONTAL_BAR_CHART,
    category: 'Comparison',
    name: 'Horizontal Bar Chart',
    aliases: ['horizontal_bar', 'hbar'],
    requiredFields: ['categories|labels', 'series|data'],
    description: 'Compares long categorical names or rankings along a horizontal scale.'
  },
  [VisualType.GROUPED_BAR_CHART]: {
    id: VisualType.GROUPED_BAR_CHART,
    category: 'Comparison',
    name: 'Grouped Bar Chart',
    aliases: ['grouped_bar', 'clustered_bar'],
    requiredFields: ['categories|labels', 'series'],
    description: 'Compares multiple series side-by-side across discrete categories.'
  },
  [VisualType.STACKED_BAR_CHART]: {
    id: VisualType.STACKED_BAR_CHART,
    category: 'Comparison',
    name: 'Stacked Bar Chart',
    aliases: ['stacked_bar'],
    requiredFields: ['categories|labels', 'series'],
    description: 'Shows total size and categorical contribution per group.'
  },
  [VisualType.LINE_CHART]: {
    id: VisualType.LINE_CHART,
    category: 'Trend',
    name: 'Line Chart',
    aliases: ['line', 'trend_chart', 'time_series'],
    requiredFields: ['categories|labels|x', 'series|data'],
    description: 'Illustrates continuous trend or time-series changes.'
  },
  [VisualType.AREA_CHART]: {
    id: VisualType.AREA_CHART,
    category: 'Trend',
    name: 'Area Chart',
    aliases: ['area'],
    requiredFields: ['categories|labels', 'series|data'],
    description: 'Emphasizes magnitude of trend changes over continuous intervals.'
  },
  [VisualType.STACKED_AREA_CHART]: {
    id: VisualType.STACKED_AREA_CHART,
    category: 'Trend',
    name: 'Stacked Area Chart',
    aliases: ['stacked_area'],
    requiredFields: ['categories|labels', 'series'],
    description: 'Shows compositional trends over time.'
  },
  [VisualType.HISTOGRAM]: {
    id: VisualType.HISTOGRAM,
    category: 'Distribution',
    name: 'Histogram',
    aliases: ['hist', 'distribution_chart'],
    requiredFields: ['data|values|bins'],
    description: 'Displays statistical frequency distributions across continuous intervals.'
  },
  [VisualType.BOX_PLOT]: {
    id: VisualType.BOX_PLOT,
    category: 'Distribution',
    name: 'Box and Whisker Plot',
    aliases: ['boxplot', 'box_whisker'],
    requiredFields: ['data'],
    description: 'Displays 5-number summary (Min, Q1, Median, Q3, Max) and outlier spread.'
  },
  [VisualType.SCATTER_PLOT]: {
    id: VisualType.SCATTER_PLOT,
    category: 'Relationship',
    name: 'Scatter Plot',
    aliases: ['scatter', 'xy_plot', 'correlation_plot'],
    requiredFields: ['data|points|series'],
    description: 'Plots relationships and correlations between two numeric variables.'
  },
  [VisualType.BUBBLE_CHART]: {
    id: VisualType.BUBBLE_CHART,
    category: 'Relationship',
    name: 'Bubble Chart',
    aliases: ['bubble'],
    requiredFields: ['data|points'],
    description: 'Plots 3-dimensional relationships (X, Y, Size/Magnitude).'
  },
  [VisualType.PIE_CHART]: {
    id: VisualType.PIE_CHART,
    category: 'Composition',
    name: 'Pie Chart',
    aliases: ['pie'],
    requiredFields: ['data|slices|values'],
    description: 'Visualizes part-to-whole categorical proportions.'
  },
  [VisualType.DONUT_CHART]: {
    id: VisualType.DONUT_CHART,
    category: 'Composition',
    name: 'Donut Chart',
    aliases: ['donut'],
    requiredFields: ['data|slices|values'],
    description: 'Displays part-to-whole proportions with central KPI callout.'
  },
  [VisualType.WATERFALL_CHART]: {
    id: VisualType.WATERFALL_CHART,
    category: 'Composition',
    name: 'Waterfall Chart',
    aliases: ['waterfall', 'bridge_chart'],
    requiredFields: ['data|steps'],
    description: 'Shows cumulative effect of sequential positive and negative values.'
  },
  [VisualType.HEATMAP]: {
    id: VisualType.HEATMAP,
    category: 'Matrix',
    name: 'Heatmap Matrix',
    aliases: ['heat_map', 'matrix_plot'],
    requiredFields: ['matrix|rows|data', 'xLabels|cols', 'yLabels|rows'],
    description: 'Visualizes 2D density or intensity using color gradations.'
  },
  [VisualType.RADAR_CHART]: {
    id: VisualType.RADAR_CHART,
    category: 'Matrix',
    name: 'Radar / Spider Chart',
    aliases: ['radar', 'spider_chart', 'web_chart'],
    requiredFields: ['axes|labels', 'series|entities'],
    description: 'Compares multivariate performance across multi-dimensional axes.'
  },
  [VisualType.GAUGE_CHART]: {
    id: VisualType.GAUGE_CHART,
    category: 'KPI',
    name: 'Radial Gauge',
    aliases: ['gauge', 'meter', 'speedometer'],
    requiredFields: ['value'],
    description: 'Displays progressive metric value against target and threshold limits.'
  },
  [VisualType.KPI_CARD]: {
    id: VisualType.KPI_CARD,
    category: 'KPI',
    name: 'KPI Metric Card',
    aliases: ['kpi', 'metric_card', 'stat_card'],
    requiredFields: ['value|metric'],
    description: 'Highlights critical single-stat metrics with delta and status indicators.'
  }
};
