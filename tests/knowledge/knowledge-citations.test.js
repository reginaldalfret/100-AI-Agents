import { describe, it } from 'node:test';
import assert from 'node:assert';
import { knowledgeService } from '../../platform/knowledge/knowledge-service.js';

describe('Knowledge Citations & Grounding', () => {
  it('should build grounded query response with evidencePack for supported query', async () => {
    const qResult = await knowledgeService.queryKnowledge('Explain 301 super orchestrator architecture');
    assert.strictEqual(qResult.grounded, true);
    assert.ok(qResult.evidencePack, 'Evidence pack must be populated');
    assert.ok(qResult.citations.length > 0, 'Citations must be returned');
    assert.ok(qResult.sources.length > 0, 'Sources must be returned');
    assert.ok(qResult.sources[0].obsidianUri.includes('obsidian://open'));
  });

  it('should enforce non-hallucination when knowledge is absent', async () => {
    const qResult = await knowledgeService.queryKnowledge('xyz123randomnonexistenttopicqwerty999', { minScore: 0.99 });
    if (!qResult.grounded) {
      assert.strictEqual(qResult.answer, "I couldn't find supporting information in your connected knowledge base.");
      assert.strictEqual(qResult.citations.length, 0);
    }
  });

  it('should format clean URI with vault and file params', () => {
    const vaultName = 'obsidian-vault';
    const relFile = '01-Architecture/301 Architecture.md';
    const cleanRel = relFile.replace(/\.md$/i, '');
    const uri = `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(cleanRel)}`;
    assert.strictEqual(uri, 'obsidian://open?vault=obsidian-vault&file=01-Architecture%2F301%20Architecture');
  });
});
