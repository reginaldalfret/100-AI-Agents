import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyTaskAndAgent } from '../../platform/multimodal/task-classifier.js';

test('Image Math Request: 17 x 28 arithmetic routes to Study/Reasoning Specialist', () => {
  const ocrText = 'Solve 17 x 28';
  const res = classifyTaskAndAgent(ocrText);
  assert.equal(res.taskType, 'MATHEMATICS_LOGIC');
  assert.equal(res.agentId, 'agent-003');
  assert.equal(res.recommendedModel, 'phi4-mini');
});
