import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { documentExtractor } from '../../platform/multimodal/document-extractor.js';
import { AgentScopeGuard } from '../../platform/intelligence/agent-scope-guard.js';

test('3. Intent-based Agent & Model Routing for Native PDF', async () => {
  const filePath = path.resolve('tests/multimodal/fixtures/project-review-request-fixed.pdf');
  const buffer = fs.readFileSync(filePath);
  const base64Data = buffer.toString('base64');

  const doc = await documentExtractor.extractContent({
    name: 'project_review_request_fixed.pdf',
    type: 'application/pdf',
    data: base64Data
  });

  const scopeGuard = new AgentScopeGuard();

  // Case A: User asks "Analyze and extract findings from this PDF"
  // For Super AI / General Research, it should be inScope and NOT forced to Email Agent
  const superAgentDecision = scopeGuard.checkScope(
    { agent_id: 'agent-101', name: 'Super AI Agent' },
    `Analyze and extract findings from this PDF.\n\n[ATTACHED EVIDENCE: ${doc.filename}]\n${doc.contentText}`
  );
  assert.strictEqual(superAgentDecision.inScope, true, 'Super AI Agent must be in-scope for PDF analysis');

  // Case B: User explicitly asks "Write an email based on this PDF"
  const emailAgentDecision = scopeGuard.checkScope(
    { agent_id: 'agent-002', name: 'Email AI Agent' },
    `Write a professional email based on this PDF.\n\n[ATTACHED EVIDENCE: ${doc.filename}]\n${doc.contentText}`
  );
  assert.strictEqual(emailAgentDecision.inScope, true, 'Email AI Agent must be in-scope for email drafting request');

  // Case C: Verification that native text does not invoke Gemma 3
  assert.strictEqual(doc.needsVision, false, 'No visual model needed for native text PDF');
  assert.strictEqual(doc.isMultimodalImage, false);
});
