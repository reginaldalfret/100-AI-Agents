/**
 * Unified Diagram Renderer & Error Boundary Test Suite
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { DiagramRenderer } from '../../platform/visuals/renderer.js';
import { VisualType } from '../../platform/visuals/schema.js';

test('1. Render Flowchart Card to HTML', () => {
  const spec = {
    type: VisualType.FLOWCHART,
    title: 'Authentication Flow',
    nodes: [
      { id: 'start', label: 'Login Attempt', kind: 'start' },
      { id: 'auth', label: 'Verify Credentials', kind: 'process' },
      { id: 'grant', label: 'Access Granted', kind: 'end' }
    ],
    edges: [
      { from: 'start', to: 'auth', label: 'Submits' },
      { from: 'auth', to: 'grant', label: 'Success' }
    ]
  };

  const html = DiagramRenderer.renderCard(spec);
  assert.ok(html.includes('liquid-diagram-card'), 'Must contain liquid diagram card class');
  assert.ok(html.includes('Authentication Flow'), 'Must render title');
  assert.ok(html.includes('<svg'), 'Must render valid SVG element');
  assert.ok(html.includes('Login Attempt'), 'Must render node labels');
});

test('2. Render Mermaid Code to HTML Card', () => {
  const mermaidCode = `
flowchart TD
  A[User Prompt] --> B[Model Router]
  B --> C[Gemma Vision]
  B --> D[Nemotron Reasoning]
  `;

  const html = DiagramRenderer.renderCard(mermaidCode, { title: 'Mermaid Model Routing' });
  assert.ok(html.includes('liquid-diagram-card'));
  assert.ok(html.includes('<svg'));
  assert.ok(html.includes('User Prompt'));
  assert.ok(html.includes('Model Router'));
});

test('3. Graceful Error Boundary on Malformed Spec', () => {
  const malformedSpec = {
    type: VisualType.FLOWCHART,
    nodes: [] // Invalid empty nodes
  };

  const html = DiagramRenderer.renderCard(malformedSpec);
  assert.ok(html.includes('error-card'), 'Must render error boundary fallback card');
  assert.ok(html.includes('Diagram Rendering Notice'), 'Must inform user cleanly');
});
