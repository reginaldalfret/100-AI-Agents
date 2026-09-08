import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { obsidianConfig } from '../../platform/knowledge/obsidian-config.js';
import { obsidianIndexer } from '../../platform/knowledge/obsidian-indexer.js';

describe('Obsidian Vault Discovery', () => {
  it('should locate configured vault path on E: drive', () => {
    assert.ok(obsidianConfig.vaultPath, 'Vault path should be defined');
    assert.match(obsidianConfig.vaultPath.toUpperCase(), /^E:/, 'Vault must reside on E: drive');
    assert.ok(fs.existsSync(obsidianConfig.vaultPath), 'Vault directory must exist');
  });

  it('should discover all markdown files recursively in vault', () => {
    const files = obsidianIndexer.discoverMarkdownFiles(obsidianConfig.vaultPath);
    assert.ok(Array.isArray(files), 'Discovery should return an array');
    assert.ok(files.length > 0, 'Should find at least 1 markdown file in vault');
    files.forEach(f => {
      assert.ok(f.endsWith('.md'), `Discovered file ${f} should have .md extension`);
    });
  });

  it('should exclude hidden directories like .obsidian and .trash', () => {
    const files = obsidianIndexer.discoverMarkdownFiles(obsidianConfig.vaultPath);
    const hiddenFiles = files.filter(f => f.includes('.obsidian') || f.includes('.trash'));
    assert.strictEqual(hiddenFiles.length, 0, 'No files inside .obsidian or .trash should be discovered');
  });

  it('should prevent path traversal outside vault', () => {
    const traversalPath = path.join(obsidianConfig.vaultPath, '..', '..', 'windows', 'system32');
    assert.strictEqual(obsidianConfig.isPathSafe(traversalPath), false, 'Path traversal must be rejected');
  });
});
