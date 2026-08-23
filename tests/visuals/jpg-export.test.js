import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DiagramExporter } from '../../platform/visuals/export.js';
import { ChartRenderer } from '../../platform/visuals/chart-renderer.js';

describe('JPG Export Subsystem', () => {
  it('generateExportFilename produces correct JPG filename', () => {
    const filename = DiagramExporter.generateExportFilename('Quarterly Revenue', 'line_chart', 'jpg');
    assert.strictEqual(filename, 'quarterly-revenue-line-chart.jpg');
  });

  it('generateExportFilename uses jpeg extension correctly', () => {
    const fn1 = DiagramExporter.generateExportFilename('Market Share', 'pie_chart', 'jpg');
    const fn2 = DiagramExporter.generateExportFilename('Market Share', 'pie_chart', 'jpeg');
    assert.strictEqual(fn1, 'market-share-pie-chart.jpg');
    assert.strictEqual(fn2, 'market-share-pie-chart.jpg');
  });

  it('JPG background color constant is defined', () => {
    assert.ok(DiagramExporter.JPG_BACKGROUND_COLOR, 'DiagramExporter.JPG_BACKGROUND_COLOR must be defined');
    assert.strictEqual(typeof DiagramExporter.JPG_BACKGROUND_COLOR, 'string', 'JPG_BACKGROUND_COLOR must be a string');
    assert.match(
      DiagramExporter.JPG_BACKGROUND_COLOR,
      /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
      'JPG_BACKGROUND_COLOR must be a valid hex color code'
    );
  });

  it('SVG for JPG export is complete', () => {
    const spec = {
      type: 'pie',
      title: 'Resource Allocation',
      data: [
        { label: 'Compute', value: 55 },
        { label: 'Storage', value: 30 },
        { label: 'Bandwidth', value: 15 }
      ]
    };
    const svg = ChartRenderer.render(spec);

    assert.ok(svg.includes('<svg'), 'SVG must have opening <svg tag');
    assert.ok(svg.includes('</svg>'), 'SVG must have closing </svg> tag');
    assert.ok(svg.includes('Resource Allocation'), 'SVG must include chart title');
    assert.ok(svg.includes('Compute'), 'SVG must include data label Compute');
    assert.ok(svg.includes('Storage'), 'SVG must include data label Storage');
    assert.ok(!svg.includes('undefined'), 'SVG must not contain undefined');
    assert.ok(!svg.includes('NaN'), 'SVG must not contain NaN');
  });

  it('SVG data URL generation works', () => {
    const testSvg = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="#06b6d4"/></svg>';
    const dataUrl = DiagramExporter.exportSvgDataUrl(testSvg);

    assert.ok(dataUrl.startsWith('data:image/svg+xml'), 'Data URL must start with data:image/svg+xml');
    assert.ok(dataUrl.includes('utf-8'), 'Data URL should specify utf-8 encoding');
    assert.ok(dataUrl.includes(encodeURIComponent('<circle')), 'Data URL must contain URL-encoded SVG content');
  });
});
