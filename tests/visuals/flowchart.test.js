/**
 * Flowchart and Process Pipeline Test Suite
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { FlowchartRenderer } from '../../platform/visuals/flowchart-renderer.js';
import { VisualType } from '../../platform/visuals/schema.js';

test('1. Vertical Process Pipeline Flowchart', () => {
  const spec = {
    type: VisualType.FLOWCHART,
    direction: 'TB',
    title: 'Industrial Inspection Workflow',
    nodes: [
      { id: '1', label: 'Ultrasonic Thickness NDT', kind: 'start' },
      { id: '2', label: 'Corrosion Rate Analysis', kind: 'process' },
      { id: '3', label: 'Remaining Life Calculation', kind: 'process' },
      { id: '4', label: 'Human-In-The-Loop Sign-Off', kind: 'decision' }
    ],
    edges: [
      { from: '1', to: '2', label: 'Readings' },
      { from: '2', to: '3', label: 'Trend' },
      { from: '3', to: '4', label: 'Assessment' }
    ]
  };

  const svg = FlowchartRenderer.render(spec);
  assert.ok(svg.includes('<svg'), 'Must produce SVG');
  assert.ok(svg.includes('Ultrasonic Thickness NDT'));
  assert.ok(svg.includes('Remaining Life Calculation'));
  assert.ok(svg.includes('marker-end="url(#arrowhead)"'));
});
