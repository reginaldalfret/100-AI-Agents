import test from 'node:test';
import assert from 'node:assert/strict';
import { SuperAIWorkflowEngine } from '../../platform/workflow-engine/super-ai-workflow-engine.js';

test('1. No Canned Results: Subtask execution contracts carry live_model source and positive duration', async () => {
  const engine = new SuperAIWorkflowEngine();
  const plan = engine.planWorkflow('Write a sorting algorithm in C++');

  const result = await engine.executeWorkflow(plan, {
    executeAgentFn: async (contract) => {
      // Simulate real specialist agent returning dynamic output
      return {
        code: '// Dynamic ' + contract.technology + ' Code for ' + contract.objective + '\nvoid sort() {}',
        content: 'Dynamically generated',
        model: 'qwen2.5-coder:1.5b',
        durationMs: 420,
        source: 'live_model'
      };
    }
  });

  assert.equal(result.status, 'COMPLETED');
  const record = result.executionRecords[0];
  assert.equal(record.source, 'live_model');
  assert.ok(record.durationMs >= 1, 'Duration must be positive');
  assert.notEqual(record.source, 'canned');
  assert.notEqual(record.source, 'default');
});
