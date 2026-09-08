import { describe, it } from 'node:test';
import assert from 'node:assert';
import { knowledgeService } from '../../platform/knowledge/knowledge-service.js';

describe('Hybrid Retrieval (Dense Vector + BM25 Lexical)', () => {
  it('should retrieve relevant notes using keyword query', async () => {
    const res = await knowledgeService.search('QLoRA 4-bit NormalFloat fine-tuning', { topK: 3 });
    assert.ok(res.totalMatches > 0, 'Should find matches for QLoRA');
    assert.ok(res.citations.length > 0, 'Should generate citations');
    const firstTitle = res.citations[0].title;
    assert.ok(firstTitle.includes('QLoRA') || firstTitle.includes('Architecture') || firstTitle.includes('Quantization'));
  });

  it('should filter search results by domain', async () => {
    const cyberRes = await knowledgeService.search('threat vulnerability security', {
      domain: 'cybersecurity',
      topK: 5
    });
    assert.ok(cyberRes.citations.length > 0);
    cyberRes.citations.forEach(c => {
      assert.strictEqual(c.domain.toLowerCase(), 'cybersecurity');
    });
  });

  it('should filter search results by tag', async () => {
    const taggedRes = await knowledgeService.search('architecture orchestrator', {
      tag: 'architecture',
      topK: 5
    });
    assert.ok(taggedRes.citations.length > 0);
    taggedRes.citations.forEach(c => {
      assert.ok(c.tags.some(t => t.toLowerCase().includes('architecture')));
    });
  });

  it('should include provenance scores and Obsidian URIs in search results', async () => {
    const res = await knowledgeService.search('Ollama offline local runtime', { topK: 2 });
    assert.ok(res.citations.length > 0);
    const cit = res.citations[0];
    assert.ok(typeof cit.score === 'number', 'Score should be numeric');
    assert.ok(cit.obsidianUri.startsWith('obsidian://open?'), 'URI must be obsidian scheme');
    assert.ok(cit.fullPath.includes('knowledge'), 'Path must reside in knowledge folder');
  });
});
