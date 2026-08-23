/**
 * Data Chart SVG Renderer Test Suite
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { ChartRenderer } from '../../platform/visuals/chart-renderer.js';
import { VisualType } from '../../platform/visuals/schema.js';

test('1. Bar Chart with Multi-Series Values', () => {
  const spec = {
    type: VisualType.BAR_CHART,
    title: 'Quarterly Sensor Telemetry',
    x: { values: ['Q1', 'Q2', 'Q3', 'Q4'] },
    series: [
      { name: 'Vibration (mm/s)', values: [1.2, 1.8, 2.4, 1.5] },
      { name: 'Temperature (°C)', values: [45, 52, 60, 48] }
    ]
  };

  const svg = ChartRenderer.render(spec);
  assert.ok(svg.includes('bar-chart'));
  assert.ok(svg.includes('Quarterly Sensor Telemetry'));
  assert.ok(svg.includes('Q1'));
});

test('2. Pie Chart with Proportional Slices', () => {
  const spec = {
    type: VisualType.PIE_CHART,
    title: 'Model Execution Distribution',
    data: [
      { label: 'Gemma 3 Vision', value: 40 },
      { label: 'Nemotron 3 Reasoning', value: 35 },
      { label: 'Qwen 2.5 Coder', value: 25 }
    ]
  };

  const svg = ChartRenderer.render(spec);
  assert.ok(svg.includes('pie-chart'));
  assert.ok(svg.includes('Gemma 3 Vision'));
  assert.ok(svg.includes('Nemotron 3 Reasoning'));
});
