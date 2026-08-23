import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ChartRenderer } from '../../platform/visuals/chart-renderer.js';

describe('ChartRenderer', () => {
  it('should render pie chart', () => {
    const spec = { type: 'pie', data: [{label: 'A', value: 10}, {label: 'B', value: 20}] };
    const svg = ChartRenderer.render(spec);
    assert(svg.includes('<svg'));
    assert(svg.includes('</svg>'));
    assert(!svg.includes('undefined'));
    assert(!svg.includes('NaN'));
  });

  it('should render donut chart', () => {
    const spec = { type: 'donut', data: [{label: 'A', value: 10}, {label: 'B', value: 20}], kpiText: 'KPI' };
    const svg = ChartRenderer.render(spec);
    assert(svg.includes('<svg'));
    assert(!svg.includes('undefined'));
    assert(!svg.includes('NaN'));
  });

  it('should render line chart', () => {
    const spec = { type: 'line', labels: ['Jan', 'Feb'], series: [{name: 'S1', values: [10, 20]}] };
    const svg = ChartRenderer.render(spec);
    assert(svg.includes('<svg'));
    assert(!svg.includes('undefined'));
    assert(!svg.includes('NaN'));
  });

  it('should render area chart', () => {
    const spec = { type: 'area', labels: ['Jan', 'Feb'], series: [{name: 'S1', values: [10, 20]}] };
    const svg = ChartRenderer.render(spec);
    assert(svg.includes('<svg'));
    assert(!svg.includes('undefined'));
    assert(!svg.includes('NaN'));
  });

  it('should render stacked area chart', () => {
    const spec = { type: 'stacked_area', labels: ['Jan', 'Feb'], series: [{name: 'S1', values: [10, 20]}, {name: 'S2', values: [5, 15]}] };
    const svg = ChartRenderer.render(spec);
    assert(svg.includes('<svg'));
    assert(!svg.includes('undefined'));
    assert(!svg.includes('NaN'));
  });

  it('should render bar chart', () => {
    const spec = { type: 'bar', labels: ['Jan', 'Feb'], series: [{name: 'S1', values: [10, 20]}] };
    const svg = ChartRenderer.render(spec);
    assert(svg.includes('<svg'));
    assert(!svg.includes('undefined'));
    assert(!svg.includes('NaN'));
  });

  it('should render horizontal bar chart', () => {
    const spec = { type: 'horizontal_bar', labels: ['Jan', 'Feb'], series: [{name: 'S1', values: [10, 20]}] };
    const svg = ChartRenderer.render(spec);
    assert(svg.includes('<svg'));
    assert(!svg.includes('undefined'));
    assert(!svg.includes('NaN'));
  });

  it('should render grouped bar chart', () => {
    const spec = { type: 'grouped_bar', labels: ['Jan', 'Feb'], series: [{name: 'S1', values: [10, 20]}, {name: 'S2', values: [5, 15]}] };
    const svg = ChartRenderer.render(spec);
    assert(svg.includes('<svg'));
    assert(!svg.includes('undefined'));
    assert(!svg.includes('NaN'));
  });

  it('should render stacked bar chart', () => {
    const spec = { type: 'stacked_bar', labels: ['Jan', 'Feb'], series: [{name: 'S1', values: [10, 20]}, {name: 'S2', values: [5, 15]}] };
    const svg = ChartRenderer.render(spec);
    assert(svg.includes('<svg'));
    assert(!svg.includes('undefined'));
    assert(!svg.includes('NaN'));
  });

  it('should render histogram', () => {
    const spec = { type: 'histogram', bins: [{min: 0, max: 10, count: 5}, {min: 10, max: 20, count: 15}] };
    const svg = ChartRenderer.render(spec);
    assert(svg.includes('<svg'));
    assert(!svg.includes('undefined'));
    assert(!svg.includes('NaN'));
  });

  it('should render scatter plot', () => {
    const spec = { type: 'scatter', data: [{x: 1, y: 2}, {x: 3, y: 4}] };
    const svg = ChartRenderer.render(spec);
    assert(svg.includes('<svg'));
    assert(!svg.includes('undefined'));
    assert(!svg.includes('NaN'));
  });

  it('should render bubble chart', () => {
    const spec = { type: 'bubble', data: [{x: 1, y: 2, r: 5}, {x: 3, y: 4, r: 10}] };
    const svg = ChartRenderer.render(spec);
    assert(svg.includes('<svg'));
    assert(!svg.includes('undefined'));
    assert(!svg.includes('NaN'));
  });

  it('should render radar chart', () => {
    const spec = { type: 'radar', axes: ['A', 'B', 'C'], series: [{name: 'S1', values: [1, 2, 3]}] };
    const svg = ChartRenderer.render(spec);
    assert(svg.includes('<svg'));
    assert(!svg.includes('undefined'));
    assert(!svg.includes('NaN'));
  });

  it('should render heatmap', () => {
    const spec = { type: 'heatmap', matrix: [[1, 2], [3, 4]], xLabels: ['X1', 'X2'], yLabels: ['Y1', 'Y2'] };
    const svg = ChartRenderer.render(spec);
    assert(svg.includes('<svg'));
    assert(!svg.includes('undefined'));
    assert(!svg.includes('NaN'));
  });

  it('should render box plot', () => {
    const spec = { type: 'box_plot', data: [{label: 'A', min: 1, q1: 2, median: 3, q3: 4, max: 5}] };
    const svg = ChartRenderer.render(spec);
    assert(svg.includes('<svg'));
    assert(!svg.includes('undefined'));
    assert(!svg.includes('NaN'));
  });

  it('should render waterfall chart', () => {
    const spec = { type: 'waterfall', data: [{label: 'Start', value: 100, type: 'total'}, {label: 'Drop', value: 20, type: 'decrease'}] };
    const svg = ChartRenderer.render(spec);
    assert(svg.includes('<svg'));
    assert(!svg.includes('undefined'));
    assert(!svg.includes('NaN'));
  });

  it('should render gauge chart', () => {
    const spec = { type: 'gauge', value: 75, min: 0, max: 100 };
    const svg = ChartRenderer.render(spec);
    assert(svg.includes('<svg'));
    assert(!svg.includes('undefined'));
    assert(!svg.includes('NaN'));
  });

  it('should render population pyramid', () => {
    const spec = { type: 'population_pyramid', data: [{label: '0-10', left: 50, right: 48}] };
    const svg = ChartRenderer.render(spec);
    assert(svg.includes('<svg'));
    assert(!svg.includes('undefined'));
    assert(!svg.includes('NaN'));
  });
});
