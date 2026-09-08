import { describe, it } from 'node:test';
import assert from 'node:assert';
import { orchestratorController } from '../../platform/orchestrator/orchestrator-controller.js';

describe('Orchestrator Knowledge Intent Routing', () => {
  it('should classify knowledge queries as KNOWLEDGE_QUERY intent', () => {
    const intent = orchestratorController._classifyIntent('search obsidian vault notes for qlora architecture');
    assert.strictEqual(intent, 'KNOWLEDGE_QUERY');
  });

  it('should route knowledge queries to 301-knowledge-specialist agent', async () => {
    const plan = await orchestratorController.processRequest('Look up documentation in my obsidian notes about Ollama');
    assert.strictEqual(plan.intent, 'KNOWLEDGE_QUERY');
    assert.strictEqual(plan.selectedAgent, '301-knowledge-specialist');
    assert.ok(plan.selectedTools.includes('search_knowledge'));
  });
});
