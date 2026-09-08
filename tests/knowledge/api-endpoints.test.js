import { describe, it } from 'node:test';
import assert from 'node:assert';
import { knowledgeService } from '../../platform/knowledge/knowledge-service.js';
import { sourceRegistry } from '../../platform/knowledge/source-registry.js';
import { obsidianIndexer } from '../../platform/knowledge/obsidian-indexer.js';

describe('Knowledge API Endpoints Functional Validation', () => {
  it('should return valid health payload', () => {
    const health = knowledgeService.getHealth();
    assert.strictEqual(typeof health.vault_accessible, 'boolean');
    assert.strictEqual(typeof health.is_air_gapped, 'boolean');
    assert.strictEqual(health.external_calls, 0);
  });

  it('should return registered sources payload', () => {
    const sources = sourceRegistry.getAllSources();
    assert.ok(Array.isArray(sources));
    assert.ok(sources.length >= 4);
  });

  it('should return indexer status', () => {
    const status = obsidianIndexer.getIndexStatus();
    assert.ok(status.status === 'READY' || status.status === 'INDEXING');
    assert.ok(typeof status.totalNotes === 'number');
  });

  it('should return grounded query response', async () => {
    const queryRes = await knowledgeService.queryKnowledge('QLoRA');
    assert.ok(queryRes.grounded !== undefined);
    assert.ok(Array.isArray(queryRes.citations));
  });
});
