/**
 * Architecture Diagram Test Suite
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { ArchitectureRenderer } from '../../platform/visuals/architecture-renderer.js';
import { VisualPlanner } from '../../platform/visuals/planner.js';

test('1. Grounded Sovereign Platform Architecture Spec', () => {
  const spec = VisualPlanner.getSovereignPlatformArchitectureSpec();
  const svg = ArchitectureRenderer.render(spec);

  assert.ok(svg.includes('101 Super AI Agents'), 'Must contain platform title');
  assert.ok(svg.includes('100-to-1 Central Gateway'), 'Must contain central gateway');
  assert.ok(svg.includes('Google Gemma 3 4B'), 'Must contain Gemma 3');
  assert.ok(svg.includes('NVIDIA Nemotron 3'), 'Must contain Nemotron 3');
  assert.ok(svg.includes('Qwen 2.5 Coder 1.5B'), 'Must contain Qwen 2.5');
  assert.ok(svg.includes('Evidence Graph'), 'Must contain evidence graph');
});
