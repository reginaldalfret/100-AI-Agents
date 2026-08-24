import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { imageQuestionPipeline } from '../../platform/multimodal/image-question-pipeline.js';
import { AgentScopeGuard } from '../../platform/intelligence/agent-scope-guard.js';

test('Image Email Request: Full execution flow for email prompt image', async () => {
  const fixturePath = path.resolve('tests/multimodal/fixtures/chatgpt-image-real.png');
  const buf = fs.readFileSync(fixturePath);

  const res = await imageQuestionPipeline.processImageQuestion({
    name: 'manager-review-email.png',
    type: 'image/png',
    data: 'data:image/png;base64,' + buf.toString('base64'),
    filePath: fixturePath
  }, { timeoutMs: 30000 });

  // Verify extraction
  assert.ok(res.text.includes('Write a professional email'), 'Must extract email instruction');
  assert.ok(res.text.includes('to my manager requesting a project review'), 'Must extract review target');

  // Verify task and routing
  assert.equal(res.classification.taskType, 'EMAIL_WRITING');
  assert.equal(res.classification.agentId, 'agent-002');
  assert.equal(res.classification.agentNumber, '002');
  assert.equal(res.classification.agentName, 'Email AI Agent');
  assert.equal(res.classification.recommendedModel, 'nemotron-3-nano:latest');

  // Verify backend trace
  assert.equal(res.backendTrace.taskClassification, 'Email Writing');
  assert.equal(res.backendTrace.agentDispatched, 'Email AI Agent (Agent 002)');
  assert.equal(res.backendTrace.modelEngine, 'nemotron-3-nano:latest');
  assert.equal(res.backendTrace.externalCalls, 0);
  assert.equal(res.backendTrace.hardware, 'NVIDIA RTX 2050');
  assert.ok(typeof res.backendTrace.elapsedMs === 'number');

  // Verify evidence block
  assert.ok(res.evidenceBlock.includes('[IMAGE OCR EVIDENCE]'));
  assert.ok(res.evidenceBlock.includes('Source: manager-review-email.png'));
  assert.ok(res.evidenceBlock.includes('[/IMAGE OCR EVIDENCE]'));

  // Verify Scope Guard allows execution
  const scopeGuard = new AgentScopeGuard();
  const decision = scopeGuard.checkScope(
    { agent_id: 'agent-002', name: 'Email AI Agent' },
    res.effectivePrompt
  );
  assert.equal(decision.inScope, true, 'Email AI Agent must accept generated evidence prompt');
});
