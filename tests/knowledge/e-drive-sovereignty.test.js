import { describe, it } from 'node:test';
import assert from 'node:assert';
import { obsidianConfig } from '../../platform/knowledge/obsidian-config.js';
import { knowledgeService } from '../../platform/knowledge/knowledge-service.js';

describe('E: Drive Sovereign Storage & Air-Gap Compliance', () => {
  it('should enforce all knowledge paths reside on E: drive', () => {
    assert.match(obsidianConfig.baseDir.toUpperCase(), /^E:/, 'baseDir must be on E:');
    assert.match(obsidianConfig.vaultPath.toUpperCase(), /^E:/, 'vaultPath must be on E:');
    assert.match(obsidianConfig.indexPath.toUpperCase(), /^E:/, 'indexPath must be on E:');
    assert.match(obsidianConfig.embeddingsPath.toUpperCase(), /^E:/, 'embeddingsPath must be on E:');
    assert.match(obsidianConfig.vectorsPath.toUpperCase(), /^E:/, 'vectorsPath must be on E:');
  });

  it('should verify health check declares air-gapped with 0 external calls', () => {
    const health = knowledgeService.getHealth();
    assert.strictEqual(health.is_air_gapped, true);
    assert.strictEqual(health.external_calls, 0);
    assert.strictEqual(health.vault_accessible, true);
  });
});
