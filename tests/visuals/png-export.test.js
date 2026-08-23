import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DiagramExporter } from '../../platform/visuals/export.js';
import { ChartRenderer } from '../../platform/visuals/chart-renderer.js';
import { ArchitectureRenderer } from '../../platform/visuals/architecture-renderer.js';

describe('PNG Export Subsystem', () => {
  it('SVG for PNG export contains valid structure', () => {
    const spec = {
      type: 'bar',
      title: 'Monthly Performance',
      labels: ['Jan', 'Feb', 'Mar'],
      series: [{ name: 'Revenue', values: [100, 200, 300] }]
    };
    const svg = ChartRenderer.render(spec);

    assert.ok(svg.includes('<svg'), 'SVG must have opening <svg tag');
    assert.ok(svg.includes('</svg>'), 'SVG must have closing </svg> tag');
    assert.ok(svg.includes('Monthly Performance'), 'SVG must contain title text');
    assert.ok(!svg.includes('undefined'), 'SVG must not contain undefined');
    assert.ok(!svg.includes('NaN'), 'SVG must not contain NaN');
  });

  it('generateExportFilename produces correct PNG filename', () => {
    const filename = DiagramExporter.generateExportFilename('Monthly Sales', 'bar_chart', 'png');
    assert.strictEqual(filename, 'monthly-sales-bar-chart.png');
  });

  it('generateExportFilename handles empty title', () => {
    const filename = DiagramExporter.generateExportFilename('', 'pie_chart', 'png');
    assert.strictEqual(filename, 'pie-chart.png');
  });

  it('generateExportFilename handles special characters', () => {
    const filename = DiagramExporter.generateExportFilename('Revenue $100M+ (2026)', 'line_chart', 'png');
    assert.strictEqual(filename, 'revenue-100m-2026-line-chart.png');
    assert.ok(!/[^a-z0-9.-]/.test(filename), 'Filename must not contain special characters or spaces');
    assert.ok(filename.endsWith('.png'), 'Filename must end with .png');
  });

  it('SVG dimensions are extractable for high-DPI export', () => {
    const spec = {
      type: 'bar',
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      series: [{ name: 'Sales', values: [50, 80, 65, 95] }]
    };
    const svg = ChartRenderer.render(spec);
    const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);

    assert.ok(viewBoxMatch, 'SVG must contain a viewBox attribute');
    const parts = viewBoxMatch[1].trim().split(/\s+/).map(Number);
    assert.strictEqual(parts.length, 4, 'viewBox must have 4 numeric components (minX, minY, width, height)');
    const [, , width, height] = parts;
    assert.ok(Number.isFinite(width) && width > 0, 'viewBox width must be a finite positive number');
    assert.ok(Number.isFinite(height) && height > 0, 'viewBox height must be a finite positive number');
  });

  it('Multiple chart types produce exportable SVG', () => {
    const chartConfigs = [
      { type: 'pie', data: [{ label: 'A', value: 40 }, { label: 'B', value: 60 }] },
      { type: 'line', labels: ['Jan', 'Feb'], series: [{ name: 'Trend', values: [10, 20] }] },
      { type: 'bar', labels: ['Jan', 'Feb'], series: [{ name: 'Volume', values: [15, 25] }] },
      { type: 'scatter', data: [{ x: 10, y: 20 }, { x: 30, y: 40 }] },
      { type: 'radar', axes: ['Speed', 'Reliability', 'Cost'], series: [{ name: 'Option A', values: [8, 9, 6] }] }
    ];

    for (const spec of chartConfigs) {
      const svg = ChartRenderer.render(spec);
      assert.ok(svg.includes('<svg'), `Type ${spec.type} must produce opening <svg tag`);
      assert.ok(svg.includes('</svg>'), `Type ${spec.type} must produce closing </svg> tag`);
      assert.ok(!svg.includes('undefined'), `Type ${spec.type} must not contain undefined`);
      assert.ok(!svg.includes('NaN'), `Type ${spec.type} must not contain NaN`);
    }
  });

  it('Large architecture diagram produces valid exportable SVG', () => {
    const spec = {
      title: 'Enterprise AI Pipeline Architecture',
      description: 'Multi-tiered Autonomous Agent Orchestration',
      nodes: [
        // Layer 1: Ingestion
        { id: 'ingest-1', label: 'HTTP Gateway', layer: 'Ingestion Layer', role: 'Ingress' },
        { id: 'ingest-2', label: 'Webhook Receiver', layer: 'Ingestion Layer', role: 'Ingress' },
        { id: 'ingest-3', label: 'Document Parser', layer: 'Ingestion Layer', role: 'Extractor' },
        { id: 'ingest-4', label: 'Stream Ingest', layer: 'Ingestion Layer', role: 'Streaming' },
        // Layer 2: Compute / Intelligence
        { id: 'agent-1', label: 'Router Agent', layer: 'Intelligence Layer', role: 'Routing' },
        { id: 'agent-2', label: 'Gemma 3 Vision', layer: 'Intelligence Layer', role: 'Vision' },
        { id: 'agent-3', label: 'Nemotron Reasoning', layer: 'Intelligence Layer', role: 'Reasoning' },
        { id: 'agent-4', label: 'Qwen Coder', layer: 'Intelligence Layer', role: 'Code Gen' },
        // Layer 3: Storage & Delivery
        { id: 'store-1', label: 'Vector Store', layer: 'Storage Layer', role: 'Retrieval' },
        { id: 'store-2', label: 'Evidence Graph', layer: 'Storage Layer', role: 'Audit Log' },
        { id: 'store-3', label: 'Model Cache', layer: 'Storage Layer', role: 'Cache' },
        { id: 'store-4', label: 'Artifact Depot', layer: 'Storage Layer', role: 'Egress' }
      ],
      edges: [
        { from: 'ingest-1', to: 'agent-1' },
        { from: 'ingest-3', to: 'agent-2' },
        { from: 'agent-1', to: 'agent-3' },
        { from: 'agent-3', to: 'store-2' }
      ]
    };

    const svg = ArchitectureRenderer.render(spec);

    assert.ok(svg.includes('<svg'), 'Architecture must render opening <svg tag');
    assert.ok(svg.includes('</svg>'), 'Architecture must render closing </svg> tag');
    assert.ok(svg.includes('Enterprise AI Pipeline Architecture'), 'Must contain diagram title');
    assert.ok(svg.includes('Ingestion Layer'), 'Must contain Ingestion Layer');
    assert.ok(svg.includes('Intelligence Layer'), 'Must contain Intelligence Layer');
    assert.ok(svg.includes('Storage Layer'), 'Must contain Storage Layer');
    assert.ok(svg.includes('HTTP Gateway'), 'Must contain node label HTTP Gateway');
    assert.ok(svg.includes('Nemotron Reasoning'), 'Must contain node label Nemotron Reasoning');
    assert.ok(!svg.includes('undefined'), 'Must not contain undefined');
    assert.ok(!svg.includes('NaN'), 'Must not contain NaN');
  });
});
