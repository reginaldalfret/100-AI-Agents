import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyTaskAndAgent, TaskType, TASK_DEFINITIONS } from '../../platform/multimodal/task-classifier.js';

test('1. Image Question Routing: Email Request maps to Email AI Agent (agent-002)', () => {
  const query = 'Write a professional email to my manager requesting a project review';
  const res = classifyTaskAndAgent(query);
  assert.equal(res.taskType, TaskType.EMAIL_WRITING);
  assert.equal(res.agentId, 'agent-002');
  assert.equal(res.agentNumber, '002');
  assert.equal(res.agentName, 'Email AI Agent');
  assert.equal(res.recommendedModel, 'nemotron-3-nano:latest');
  assert.ok(res.confidence >= 0.90, 'Confidence must be >= 0.90');
});

test('2. Image Question Routing: Python Code Request maps to Python AI Agent (agent-101)', () => {
  const queries = [
    'Write a palindrome program in Python',
    'Write a palindrome program in Python with type annotations',
    'Create an async python script using asyncio'
  ];

  for (const query of queries) {
    const res = classifyTaskAndAgent(query);
    assert.equal(res.taskType, TaskType.PYTHON_PROGRAMMING);
    assert.equal(res.agentId, 'agent-101');
    assert.equal(res.agentNumber, '101');
    assert.equal(res.agentName, 'Python AsyncIO AI Agent');
    assert.equal(res.recommendedModel, 'qwen2.5-coder:1.5b');
    assert.ok(res.confidence >= 0.90);
  }
});

test('3. Image Question Routing: Math Problem (17 x 28) maps to Study/Math AI Agent (agent-003)', () => {
  const queries = [
    'Solve 17 x 28',
    'Solve 17 × 28',
    'Solve: 17 * 28 and explain step by step'
  ];

  for (const query of queries) {
    const res = classifyTaskAndAgent(query);
    assert.equal(res.taskType, TaskType.MATHEMATICS_LOGIC);
    assert.equal(res.agentId, 'agent-003');
    assert.equal(res.agentNumber, '003');
    assert.equal(res.agentName, 'Study AI Agent');
    assert.equal(res.recommendedModel, 'phi4-mini');
    assert.ok(res.confidence >= 0.90);
  }
});

test('4. Image Question Routing: Algebraic Equation maps to Math AI Agent (agent-003)', () => {
  const query = 'Solve: 2x + 5 = 15';
  const res = classifyTaskAndAgent(query);
  assert.equal(res.taskType, TaskType.MATHEMATICS_LOGIC);
  assert.equal(res.agentId, 'agent-003');
  assert.equal(res.recommendedModel, 'phi4-mini');
});

test('5. Image Question Routing: Summarization maps to Summarization AI Agent (agent-005)', () => {
  const query = 'Summarize the key findings into 3 bullet points';
  const res = classifyTaskAndAgent(query);
  assert.equal(res.taskType, TaskType.SUMMARIZATION);
  assert.equal(res.agentId, 'agent-005');
  assert.equal(res.recommendedModel, 'smollm2:1.7b');
});

test('6. Image Question Routing: Grammar correction maps to Grammar AI Agent (agent-006)', () => {
  const query = 'Proofread and fix grammar errors in this paragraph';
  const res = classifyTaskAndAgent(query);
  assert.equal(res.taskType, TaskType.GRAMMAR_REWRITE);
  assert.equal(res.agentId, 'agent-006');
  assert.equal(res.recommendedModel, 'smollm2:1.7b');
});

test('7. Image Question Routing: Empty or unclassified input gracefully falls back to General Writing (agent-001)', () => {
  const emptyRes = classifyTaskAndAgent('');
  assert.equal(emptyRes.taskType, TaskType.GENERAL_WRITING);
  assert.equal(emptyRes.agentId, 'agent-001');

  const fallbackRes = classifyTaskAndAgent('A generic unstructured sentence');
  assert.equal(fallbackRes.taskType, TaskType.GENERAL_WRITING);
  assert.equal(fallbackRes.agentId, 'agent-001');
});
