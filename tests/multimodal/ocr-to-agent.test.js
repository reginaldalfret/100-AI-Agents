import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyTaskAndAgent } from '../../platform/multimodal/task-classifier.js';

test('OCR to Agent: Symmetric routing between typed text and OCR extracted text', () => {
  const typedText = 'Write a professional email to my manager requesting a project review';
  const typedClassification = classifyTaskAndAgent(typedText);

  const ocrText = 'Write a professional email to my manager requesting a project review';
  const ocrClassification = classifyTaskAndAgent(ocrText);

  assert.equal(typedClassification.taskType, ocrClassification.taskType);
  assert.equal(typedClassification.agentId, ocrClassification.agentId);
  assert.equal(typedClassification.recommendedModel, ocrClassification.recommendedModel);
  assert.equal(typedClassification.agentName, ocrClassification.agentName);
});
