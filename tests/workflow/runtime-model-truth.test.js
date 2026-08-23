import test from 'node:test';
import assert from 'node:assert/strict';
import { SuperAIWorkflowEngine } from '../../platform/workflow-engine/super-ai-workflow-engine.js';

test('6. Runtime Model Truth: Execution records report truthful model metadata', async () => {
  const engine = new SuperAIWorkflowEngine();
  const plan = engine.planWorkflow('Write a palindrome program in C++, Java, Python');

  const result = await engine.executeWorkflow(plan, {
    executeAgentFn: async (contract) => ({
      code: '// ' + contract.technology,
      model: 'qwen2.5-coder:1.5b',
      durationMs: 120,
      source: 'live_model'
    })
  });

  for (const record of result.executionRecords) {
    assert.equal(record.runtimeModel, 'qwen2.5-coder:1.5b');
    assert.equal(record.modelName, 'Qwen 2.5 Coder');
    assert.equal(record.runtime, 'Local Ollama (Air-Gapped)');
    assert.equal(record.source, 'live_model');
  }
});
