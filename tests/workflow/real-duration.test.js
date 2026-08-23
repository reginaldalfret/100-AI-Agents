import test from 'node:test';
import assert from 'node:assert/strict';
import { SuperAIWorkflowEngine } from '../../platform/workflow-engine/super-ai-workflow-engine.js';

test('5. Real Duration: Measured durations are strictly greater than 0ms', async () => {
  const engine = new SuperAIWorkflowEngine();
  const plan = engine.planWorkflow('Write a palindrome program in C++, Java, Python');

  const result = await engine.executeWorkflow(plan, {
    executeAgentFn: async (contract) => {
      // Simulate real specialist execution with non-zero duration
      await new Promise(r => setTimeout(r, 10));
      return {
        code: '// ' + contract.technology + ' implementation',
        model: 'qwen2.5-coder:1.5b',
        durationMs: 15,
        source: 'live_model'
      };
    }
  });

  assert.ok(result.totalDurationMs >= 1, 'Total workflow duration must be >= 1ms');

  for (const record of result.executionRecords) {
    assert.ok(record.durationMs >= 1, 'Subtask ' + record.subtaskId + ' durationMs must be >= 1ms');
    assert.ok(record.startedAt, 'startedAt timestamp must be recorded');
    assert.ok(record.completedAt, 'completedAt timestamp must be recorded');
  }
});
