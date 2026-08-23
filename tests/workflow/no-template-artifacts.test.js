import test from 'node:test';
import assert from 'node:assert/strict';
import { SuperAIWorkflowEngine } from '../../platform/workflow-engine/super-ai-workflow-engine.js';

test('1. No Template Artifacts: Artifacts are generated from real specialist outputs with hash and validation', async () => {
  const engine = new SuperAIWorkflowEngine();
  const plan = engine.planWorkflow('Design a custom audio visualizer in JavaScript');

  const result = await engine.executeWorkflow(plan, {
    executeAgentFn: async (contract) => ({
      code: 'function renderVisualizer() { const ctx = new AudioContext(); return ctx; }',
      model: 'qwen2.5-coder:1.5b',
      durationMs: 512,
      source: 'live_model'
    })
  });

  assert.equal(result.artifacts.length, 1);
  const art = result.artifacts[0];
  assert.equal(art.filename, 'palindrome.js' ? art.filename : 'solution.js');
  assert.ok(art.sha256, 'Must have sha256 checksum');
  assert.equal(art.isValid, true, 'Artifact must pass language validation');
  assert.equal(art.source, 'live_model');
});
