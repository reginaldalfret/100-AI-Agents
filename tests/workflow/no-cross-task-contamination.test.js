import test from 'node:test';
import assert from 'node:assert/strict';
import { SuperAIWorkflowEngine } from '../../platform/workflow-engine/super-ai-workflow-engine.js';

test('4. No Cross-Task Contamination: E-Commerce web design generates pure HTML, CSS, and JS without Java', async () => {
  const engine = new SuperAIWorkflowEngine();
  const plan = engine.planWorkflow('design a E-Commerce website in HTML, CSS, JavaScript');

  assert.equal(plan.workflowType, 'DEPENDENCY_GRAPH');
  assert.equal(plan.subtasks.length, 3);

  const result = await engine.executeWorkflow(plan, {
    executeAgentFn: async (contract) => {
      if (contract.technology === 'HTML') {
        return {
          code: '<!DOCTYPE html><html><head><title>Shop</title></head><body><div id="catalog"></div></body></html>',
          content: 'HTML structure generated.',
          model: 'qwen2.5-coder:1.5b',
          durationMs: 240,
          source: 'live_model'
        };
      }
      if (contract.technology === 'CSS') {
        return {
          code: ':root { --primary: #06b6d4; } body { margin: 0; background: #0a0e1a; } #catalog { display: grid; }',
          content: 'CSS styling generated.',
          model: 'qwen2.5-coder:1.5b',
          durationMs: 190,
          source: 'live_model'
        };
      }
      if (contract.technology === 'JavaScript') {
        return {
          code: 'const catalog = document.getElementById("catalog"); function render() { console.log("Catalog rendered"); } document.addEventListener("DOMContentLoaded", render);',
          content: 'JavaScript interaction generated.',
          model: 'qwen2.5-coder:1.5b',
          durationMs: 320,
          source: 'live_model'
        };
      }
      return { code: '// specialist code', model: 'qwen2.5-coder:1.5b', durationMs: 100, source: 'live_model' };
    }
  });

  assert.equal(result.status, 'COMPLETED');

  const html = result.artifacts.find(a => a.filename === 'index.html');
  const css = result.artifacts.find(a => a.filename === 'styles.css');
  const js = result.artifacts.find(a => a.filename === 'script.js');

  assert.ok(html, 'index.html artifact generated');
  assert.ok(css, 'styles.css artifact generated');
  assert.ok(js, 'script.js artifact generated');

  // Verify JS does NOT contain Java code
  assert.ok(!js.content.includes('public class'), 'JS must not contain Java class definition');
  assert.ok(!js.content.includes('System.out.println'), 'JS must not contain System.out.println');
  assert.ok(!js.content.includes('StringBuilder'), 'JS must not contain StringBuilder');

  // Verify JS contains JavaScript constructs
  assert.ok(js.content.includes('function') || js.content.includes('const') || js.content.includes('let'));
  assert.equal(js.isValid, true);
});
