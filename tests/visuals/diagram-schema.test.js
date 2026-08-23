/**
 * Diagram Schema & Sanitization Security Test Suite
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { DiagramValidator } from '../../platform/visuals/validator.js';
import { DiagramSanitizer } from '../../platform/visuals/sanitizer.js';
import { VisualType } from '../../platform/visuals/schema.js';

test('1. Valid Graph Specification Validation', () => {
  const spec = {
    type: VisualType.FLOWCHART,
    nodes: [
      { id: 'start', label: 'User Query', kind: 'start' },
      { id: 'agent', label: 'Super AI Agent', kind: 'agent' }
    ],
    edges: [
      { from: 'start', to: 'agent', label: 'Processes' }
    ]
  };

  const res = DiagramValidator.validate(spec);
  assert.strictEqual(res.valid, true);
});

test('2. Reject Duplicate Node IDs', () => {
  const spec = {
    type: VisualType.FLOWCHART,
    nodes: [
      { id: 'node_1', label: 'First' },
      { id: 'node_1', label: 'Duplicate' }
    ]
  };

  const res = DiagramValidator.validate(spec);
  assert.strictEqual(res.valid, false);
  assert.match(res.error, /duplicate node id/i);
});

test('3. XSS & Script Tag Sanitization', () => {
  const dangerousLabel = '<script>alert("XSS")</script>User Request <img src=x onerror=alert(1)>';
  const clean = DiagramSanitizer.sanitizeLabel(dangerousLabel);

  assert.doesNotMatch(clean, /<script>/i);
  assert.doesNotMatch(clean, /onerror=/i);
  assert.ok(clean.includes('User Request'));
});

test('4. Chart Numeric Validation', () => {
  const validChart = {
    type: VisualType.BAR_CHART,
    x: { values: ['Q1', 'Q2'] },
    series: [{ name: 'Sales', values: [100, 200] }]
  };
  assert.strictEqual(DiagramValidator.validate(validChart).valid, true);

  const invalidChart = {
    type: VisualType.BAR_CHART,
    series: [{ name: 'Sales', values: [100, NaN] }]
  };
  assert.strictEqual(DiagramValidator.validate(invalidChart).valid, false);
});
