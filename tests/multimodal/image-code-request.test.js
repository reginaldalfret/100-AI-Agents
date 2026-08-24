import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyTaskAndAgent } from '../../platform/multimodal/task-classifier.js';

test('Image Code Request: Palindrome Python request routes to Python Specialist', () => {
  const ocrText = 'Write a palindrome program in Python';
  const res = classifyTaskAndAgent(ocrText);
  assert.equal(res.taskType, 'PYTHON_PROGRAMMING');
  assert.equal(res.agentId, 'agent-101');
  assert.equal(res.recommendedModel, 'qwen2.5-coder:1.5b');
});
