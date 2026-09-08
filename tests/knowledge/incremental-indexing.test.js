import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { obsidianIndexer } from '../../platform/knowledge/obsidian-indexer.js';
import { obsidianConfig } from '../../platform/knowledge/obsidian-config.js';

describe('Obsidian Incremental Indexing', () => {
  it('should run sync and produce manifest on E: drive', async () => {
    const result = await obsidianIndexer.syncIncremental();
    assert.ok(result.status === 'READY', 'Status should be READY');
    assert.ok(result.totalNotes >= 7, 'Should index at least 7 notes');
    assert.ok(fs.existsSync(obsidianConfig.manifestFile), 'Manifest file must exist on disk');
  });

  it('should skip unchanged files on second sync via SHA-256 matching', async () => {
    const secondSync = await obsidianIndexer.syncIncremental();
    assert.strictEqual(secondSync.indexed, 0, 'No files should be re-indexed when nothing changed');
    assert.ok(secondSync.unchanged >= 7, 'All existing files should be recognized as unchanged');
  });

  it('should report correct index status metrics', () => {
    const status = obsidianIndexer.getIndexStatus();
    assert.ok(status.totalNotes >= 7);
    assert.ok(status.totalChunks >= 10);
    assert.ok(status.lastSync, 'lastSync timestamp must be present');
  });
});
