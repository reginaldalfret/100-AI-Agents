import { describe, it } from 'node:test';
import assert from 'node:assert';
import { knowledgeService } from '../../platform/knowledge/knowledge-service.js';

describe('Knowledge Service Facade', () => {
  it('should return health metrics', () => {
    const health = knowledgeService.getHealth();
    assert.ok(health.document_count >= 7);
    assert.ok(health.chunk_count >= 10);
    assert.strictEqual(health.embedding_service, 'local-cpu-dense-384');
  });

  it('should search across indexed notes', async () => {
    const res = await knowledgeService.search('RTX 2050 GPU');
    assert.ok(res.chunks.length > 0);
    assert.strictEqual(res.isAirGapped, true);
  });

  it('should safely validate note opening', async () => {
    const validRes = await knowledgeService.openNote('01-Architecture/301 Architecture.md');
    assert.strictEqual(validRes.success, true);
    assert.ok(validRes.uri.includes('obsidian://open'));

    const unsafeRes = await knowledgeService.openNote('../../windows/notepad.exe');
    assert.strictEqual(unsafeRes.success, false);
    assert.ok(unsafeRes.error.includes('Access denied'));
  });
});
