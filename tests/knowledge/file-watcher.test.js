import { describe, it, after } from 'node:test';
import assert from 'node:assert';
import { obsidianWatcher } from '../../platform/knowledge/obsidian-watcher.js';

describe('Obsidian File Watcher', () => {
  after(() => {
    obsidianWatcher.stopWatching();
  });

  it('should start watching vault directory without throwing', () => {
    obsidianWatcher.startWatching();
    assert.strictEqual(obsidianWatcher.isWatching, true);
  });

  it('should stop watching cleanly', () => {
    obsidianWatcher.stopWatching();
    assert.strictEqual(obsidianWatcher.isWatching, false);
  });

  it('should handle multiple start/stop calls gracefully', () => {
    obsidianWatcher.startWatching();
    obsidianWatcher.startWatching();
    assert.strictEqual(obsidianWatcher.isWatching, true);
    obsidianWatcher.stopWatching();
    assert.strictEqual(obsidianWatcher.isWatching, false);
  });
});
