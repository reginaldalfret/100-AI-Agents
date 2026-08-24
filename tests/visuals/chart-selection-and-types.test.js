import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ChartRenderer } from '../../platform/visuals/chart-renderer.js';
import { ChartSelector } from '../../platform/visuals/chart-selector.js';
import { VisualDataParser } from '../../platform/visuals/parser.js';
import { VisualType } from '../../platform/visuals/schema.js';

describe('Comprehensive Visualization Engine & Automatic Selector', () => {
  // 1. Comparison Charts
  it('renders vertical bar chart from canonical categories & series.data format', () => {
    const spec = {
      type: 'bar_chart',
      title: 'Regional Sales',
      categories: ['North', 'South', 'East', 'West'],
      series: [{ name: 'Revenue', data: [120, 140, 90, 160] }]
    };
    const svg = ChartRenderer.render(spec);
    assert.ok(svg.includes('<svg'));
    assert.ok(svg.includes('Regional Sales'));
    assert.ok(svg.includes('North'));
    assert.ok(!svg.includes('NaN'));
    assert.ok(!svg.includes('undefined'));
  });

  it('renders horizontal bar chart with long categorical labels', () => {
    const spec = {
      type: 'horizontal_bar_chart',
      title: 'Top AI Specialists',
      categories: ['001 Python Master', '002 Database Architect', '003 Cloud Engineer'],
      series: [{ name: 'Tasks Completed', data: [450, 380, 510] }]
    };
    const svg = ChartRenderer.render(spec);
    assert.ok(svg.includes('<svg'));
    assert.ok(svg.includes('Top AI Specialists'));
    assert.ok(svg.includes('001 Python Master'));
    assert.ok(!svg.includes('NaN'));
  });

  it('renders grouped bar chart with multi-series comparison', () => {
    const spec = {
      type: 'grouped_bar_chart',
      title: 'Q1 vs Q2 Performance',
      categories: ['Product A', 'Product B', 'Product C'],
      series: [
        { name: 'Q1', data: [100, 200, 150] },
        { name: 'Q2', data: [130, 220, 190] }
      ]
    };
    const svg = ChartRenderer.render(spec);
    assert.ok(svg.includes('<svg'));
    assert.ok(svg.includes('Q1'));
    assert.ok(svg.includes('Q2'));
    assert.ok(!svg.includes('NaN'));
  });

  it('renders stacked bar chart with cumulative totals', () => {
    const spec = {
      type: 'stacked_bar_chart',
      title: 'Department Headcount',
      categories: ['2024', '2025', '2026'],
      series: [
        { name: 'Engineering', data: [50, 80, 120] },
        { name: 'Operations', data: [30, 40, 60] }
      ]
    };
    const svg = ChartRenderer.render(spec);
    assert.ok(svg.includes('<svg'));
    assert.ok(svg.includes('Department Headcount'));
    assert.ok(!svg.includes('NaN'));
  });

  // 2. Trend Charts
  it('renders multi-series line chart with date progression', () => {
    const spec = {
      type: 'line_chart',
      title: 'Throughput Trends (req/sec)',
      categories: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
      series: [
        { name: 'Gateway', data: [400, 300, 850, 1200, 1100, 950] },
        { name: 'Python Compute', data: [200, 150, 450, 700, 650, 500] }
      ]
    };
    const svg = ChartRenderer.render(spec);
    assert.ok(svg.includes('<svg'));
    assert.ok(svg.includes('Throughput Trends'));
    assert.ok(!svg.includes('NaN'));
  });

  it('renders area chart with filled opacity gradient', () => {
    const spec = {
      type: 'area_chart',
      title: 'Memory Utilization (MB)',
      categories: ['Jan', 'Feb', 'Mar', 'Apr'],
      series: [{ name: 'VRAM', data: [1200, 1800, 2400, 3100] }]
    };
    const svg = ChartRenderer.render(spec);
    assert.ok(svg.includes('<svg'));
    assert.ok(!svg.includes('NaN'));
  });

  // 3. Distribution & Statistical Charts
  it('renders histogram with automatic binning from raw values', () => {
    const spec = {
      type: 'histogram',
      title: 'API Latency Distribution (ms)',
      data: [12, 15, 18, 22, 25, 28, 32, 35, 45, 50, 65, 80, 95, 110, 120],
      bins: 5
    };
    const svg = ChartRenderer.render(spec);
    assert.ok(svg.includes('<svg'));
    assert.ok(svg.includes('API Latency Distribution'));
    assert.ok(!svg.includes('NaN'));
  });

  it('renders box plot with 5-number quartile summary', () => {
    const spec = {
      type: 'box_plot',
      title: 'Corrosion Depth Distribution (mm)',
      data: [
        { label: 'Exchanger HX-101', min: 1.2, q1: 2.1, median: 3.4, q3: 4.8, max: 6.2 },
        { label: 'Exchanger HX-204', min: 2.0, q1: 3.5, median: 5.1, q3: 6.9, max: 8.7 }
      ]
    };
    const svg = ChartRenderer.render(spec);
    assert.ok(svg.includes('<svg'));
    assert.ok(svg.includes('HX-204'));
    assert.ok(!svg.includes('NaN'));
  });

  // 4. Relationship Charts
  it('renders scatter plot for XY numeric correlation', () => {
    const spec = {
      type: 'scatter_plot',
      title: 'Operating Temperature vs Corrosion Rate',
      data: [
        { x: 120, y: 0.12 },
        { x: 150, y: 0.25 },
        { x: 180, y: 0.42 },
        { x: 210, y: 0.68 }
      ]
    };
    const svg = ChartRenderer.render(spec);
    assert.ok(svg.includes('<svg'));
    assert.ok(svg.includes('Operating Temperature vs Corrosion Rate'));
    assert.ok(!svg.includes('NaN'));
  });

  // 5. Matrix & KPI Charts
  it('renders heatmap matrix with normalized intensity', () => {
    const spec = {
      type: 'heatmap',
      title: 'Sensor Correlation Matrix',
      xLabels: ['Temp', 'Pressure', 'Vibration'],
      yLabels: ['Temp', 'Pressure', 'Vibration'],
      matrix: [
        [1.0, 0.85, 0.42],
        [0.85, 1.0, 0.61],
        [0.42, 0.61, 1.0]
      ]
    };
    const svg = ChartRenderer.render(spec);
    assert.ok(svg.includes('<svg'));
    assert.ok(svg.includes('Sensor Correlation Matrix'));
    assert.ok(!svg.includes('NaN'));
  });

  it('renders gauge chart with threshold indicators', () => {
    const spec = {
      type: 'gauge_chart',
      title: 'Reactor Vessel Pressure',
      value: 78.5,
      min: 0,
      max: 100,
      unit: 'bar'
    };
    const svg = ChartRenderer.render(spec);
    assert.ok(svg.includes('<svg'));
    assert.ok(svg.includes('78.5'));
    assert.ok(svg.includes('bar'));
    assert.ok(!svg.includes('NaN'));
  });

  it('renders KPI metric card with trend delta', () => {
    const spec = {
      type: 'kpi_card',
      title: 'Total Active Agents',
      value: '301',
      delta: '+200 in SIH Release',
      status: 'positive'
    };
    const svg = ChartRenderer.render(spec);
    assert.ok(svg.includes('<svg'));
    assert.ok(svg.includes('301'));
    assert.ok(!svg.includes('NaN'));
  });

  // 6. Automatic Chart Selector & Data Shape Classifier
  it('automatically selects BAR_CHART for categorical comparison', () => {
    const res = ChartSelector.selectChart({ prompt: 'Compare sales across North, South, East, West regions' });
    assert.equal(res.recommendedType, VisualType.BAR_CHART);
  });

  it('automatically selects LINE_CHART for time series trends', () => {
    const res = ChartSelector.selectChart({ prompt: 'Plot monthly revenue growth over the year' });
    assert.equal(res.recommendedType, VisualType.LINE_CHART);
  });

  it('automatically selects HISTOGRAM for distribution queries', () => {
    const res = ChartSelector.selectChart({ prompt: 'Show the frequency distribution of thickness measurements' });
    assert.equal(res.recommendedType, VisualType.HISTOGRAM);
  });

  it('automatically selects SCATTER_PLOT for correlation queries', () => {
    const res = ChartSelector.selectChart({ prompt: 'Find the correlation between temperature and failure rate' });
    assert.equal(res.recommendedType, VisualType.SCATTER_PLOT);
  });

  it('automatically selects PIE_CHART for market share queries', () => {
    const res = ChartSelector.selectChart({ prompt: 'Display market share breakdown of top 4 competitors' });
    assert.equal(res.recommendedType, VisualType.PIE_CHART);
  });

  it('automatically selects HEATMAP for 2D matrix data', () => {
    const res = ChartSelector.selectChart({
      data: { matrix: [[1, 2], [3, 4]] }
    });
    assert.equal(res.recommendedType, VisualType.HEATMAP);
  });

  // 7. Markdown Table Parser & Converter
  it('parses Markdown tables directly into canonical chart specifications', () => {
    const tableMd = `
| Refinery Unit | Throughput (bpd) | Efficiency (%) |
|---|---|---|
| Crude Distillation (CDU) | 120000 | 94.2 |
| Fluid Catalytic Cracking (FCC) | 85000 | 91.5 |
| Hydrocracker (HCU) | 65000 | 96.8 |
`;
    const tableObj = VisualDataParser.parseMarkdownTable(tableMd);
    assert.ok(tableObj);
    assert.equal(tableObj.headers.length, 3);
    assert.equal(tableObj.rows.length, 3);

    const chartSpec = VisualDataParser.tableToChartSpec(tableObj, 'Compare throughput across units');
    assert.ok(chartSpec);
    assert.equal(chartSpec.categories.length, 3);
    assert.equal(chartSpec.series.length, 2);

    const svg = ChartRenderer.render(chartSpec);
    assert.ok(svg.includes('<svg'));
    assert.ok(svg.includes('Crude Distillation'));
    assert.ok(!svg.includes('NaN'));
  });
});
