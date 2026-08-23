import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DiagramExporter } from '../../platform/visuals/export.js';
import { FlowchartRenderer } from '../../platform/visuals/flowchart-renderer.js';
import { ArchitectureRenderer } from '../../platform/visuals/architecture-renderer.js';
import { SequenceRenderer } from '../../platform/visuals/sequence-renderer.js';
import { TimelineRenderer } from '../../platform/visuals/timeline-renderer.js';
import { ChartRenderer } from '../../platform/visuals/chart-renderer.js';
import { VisualType } from '../../platform/visuals/schema.js';

describe('Diagram Export Subsystem', () => {
  it('Flowchart SVG is exportable', () => {
    const spec = {
      type: 'flowchart',
      title: 'Agent Workflow',
      nodes: [
        { id: '1', label: 'Input Prompt', kind: 'start' },
        { id: '2', label: 'Autonomous Planner', kind: 'agent' },
        { id: '3', label: 'Tool Execution', kind: 'process' },
        { id: '4', label: 'Final Output', kind: 'end' }
      ],
      edges: [
        { from: '1', to: '2', label: 'Prompt' },
        { from: '2', to: '3', label: 'Plan' },
        { from: '3', to: '4', label: 'Results' }
      ]
    };
    const svg = FlowchartRenderer.render(spec);

    assert.ok(svg.includes('<svg'), 'Flowchart SVG must contain opening tag');
    assert.ok(svg.includes('</svg>'), 'Flowchart SVG must contain closing tag');
    assert.ok(svg.includes('Agent Workflow'), 'Flowchart SVG must contain title');
    assert.ok(svg.includes('Input Prompt'), 'Flowchart SVG must contain node label');

    const dataUrl = DiagramExporter.exportSvgDataUrl(svg);
    assert.ok(dataUrl.startsWith('data:image/svg+xml'), 'Flowchart data URL must start with data:image/svg+xml');
  });

  it('Architecture SVG is exportable', () => {
    const spec = {
      title: 'Distributed Agent Mesh',
      nodes: [
        { id: 'n1', label: 'API Gateway', layer: 'Gateway Tier', role: 'Proxy' },
        { id: 'n2', label: 'Worker Agent 1', layer: 'Worker Tier', role: 'Compute' },
        { id: 'n3', label: 'Worker Agent 2', layer: 'Worker Tier', role: 'Compute' },
        { id: 'n4', label: 'Shared State Store', layer: 'Data Tier', role: 'Database' }
      ],
      edges: [
        { from: 'n1', to: 'n2' },
        { from: 'n1', to: 'n3' },
        { from: 'n2', to: 'n4' }
      ]
    };
    const svg = ArchitectureRenderer.render(spec);

    assert.ok(svg.includes('<svg'), 'Architecture SVG must contain opening tag');
    assert.ok(svg.includes('</svg>'), 'Architecture SVG must contain closing tag');
    assert.ok(svg.includes('Distributed Agent Mesh'), 'Architecture SVG must contain title');
    assert.ok(svg.includes('Gateway Tier'), 'Architecture SVG must contain layer name');

    const dataUrl = DiagramExporter.exportSvgDataUrl(svg);
    assert.ok(dataUrl.startsWith('data:image/svg+xml'), 'Architecture data URL must start with data:image/svg+xml');
  });

  it('Sequence diagram SVG is exportable', () => {
    const spec = {
      title: 'Agent Handshake Protocol',
      actors: [
        { id: 'client', name: 'User Client' },
        { id: 'gateway', name: 'Gateway Server' },
        { id: 'agent', name: 'Core Agent' }
      ],
      messages: [
        { from: 'client', to: 'gateway', label: 'POST /task' },
        { from: 'gateway', to: 'agent', label: 'Dispatch Task' },
        { from: 'agent', to: 'gateway', label: 'Task Complete', type: 'return' },
        { from: 'gateway', to: 'client', label: '200 OK', type: 'return' }
      ]
    };
    const svg = SequenceRenderer.render(spec);

    assert.ok(svg.includes('<svg'), 'Sequence SVG must contain opening tag');
    assert.ok(svg.includes('</svg>'), 'Sequence SVG must contain closing tag');
    assert.ok(svg.includes('Agent Handshake Protocol'), 'Sequence SVG must contain title');
    assert.ok(svg.includes('User Client'), 'Sequence SVG must contain actor name');

    const dataUrl = DiagramExporter.exportSvgDataUrl(svg);
    assert.ok(dataUrl.startsWith('data:image/svg+xml'), 'Sequence data URL must start with data:image/svg+xml');
  });

  it('Timeline SVG is exportable', () => {
    const spec = {
      title: 'Autonomous Execution Milestones',
      events: [
        { date: 'T+0s', title: 'Intent Classification', description: 'Gemma 3 selected' },
        { date: 'T+1.2s', title: 'Multi-Agent Decomposition', description: '3 sub-tasks generated' },
        { date: 'T+3.5s', title: 'Parallel Execution Complete', description: '100% success rate' }
      ]
    };
    const svg = TimelineRenderer.render(spec);

    assert.ok(svg.includes('<svg'), 'Timeline SVG must contain opening tag');
    assert.ok(svg.includes('</svg>'), 'Timeline SVG must contain closing tag');
    assert.ok(svg.includes('Autonomous Execution Milestones'), 'Timeline SVG must contain title');
    assert.ok(svg.includes('Intent Classification'), 'Timeline SVG must contain event title');

    const dataUrl = DiagramExporter.exportSvgDataUrl(svg);
    assert.ok(dataUrl.startsWith('data:image/svg+xml'), 'Timeline data URL must start with data:image/svg+xml');
  });

  it('Pie chart JPG filename', () => {
    const filename = DiagramExporter.generateExportFilename('Market Share Breakdown', 'pie_chart', 'jpg');
    assert.strictEqual(filename, 'market-share-breakdown-pie-chart.jpg');
  });

  it('Bar chart PNG filename', () => {
    const filename = DiagramExporter.generateExportFilename('Annual Growth 2026', 'bar_chart', 'png');
    assert.strictEqual(filename, 'annual-growth-2026-bar-chart.png');
  });

  it('All visual types map to valid filenames', () => {
    const visualTypes = Object.values(VisualType);
    assert.ok(visualTypes.length > 0, 'VisualType enum must contain types');

    for (const type of visualTypes) {
      const pngFilename = DiagramExporter.generateExportFilename('System Visual', type, 'png');
      const jpgFilename = DiagramExporter.generateExportFilename('System Visual', type, 'jpg');

      assert.ok(pngFilename.endsWith('.png'), `PNG filename for ${type} must end with .png`);
      assert.ok(jpgFilename.endsWith('.jpg'), `JPG filename for ${type} must end with .jpg`);

      assert.ok(!/\s/.test(pngFilename), `PNG filename for ${type} must not contain whitespace: ${pngFilename}`);
      assert.ok(!/\s/.test(jpgFilename), `JPG filename for ${type} must not contain whitespace: ${jpgFilename}`);
      assert.ok(!/[A-Z]/.test(pngFilename), `PNG filename for ${type} must be lowercase: ${pngFilename}`);
      assert.ok(!/[A-Z]/.test(jpgFilename), `JPG filename for ${type} must be lowercase: ${jpgFilename}`);
      assert.ok(!/[^a-z0-9.-]/.test(pngFilename), `PNG filename for ${type} must only have valid characters: ${pngFilename}`);
      assert.ok(!/[^a-z0-9.-]/.test(jpgFilename), `JPG filename for ${type} must only have valid characters: ${jpgFilename}`);
    }
  });
});
