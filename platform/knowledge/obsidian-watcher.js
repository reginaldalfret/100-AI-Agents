/**
 * Sovereign AI Workbench — Obsidian Vault Real-Time File Watcher
 * Detects Markdown note creations, edits, renames, and deletions in real-time,
 * immediately updating the Knowledge Base and RAG indexes without restarts.
 *
 * 100% On-Premise, Air-Gapped, Zero External Dependencies.
 */

import fs from 'node:fs';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { obsidianConfig } from './obsidian-config.js';
import { obsidianIndexer } from './obsidian-indexer.js';

export class ObsidianWatcher extends EventEmitter {
  constructor(options = {}) {
    super();
    this.config = options.config || obsidianConfig;
    this.indexer = options.indexer || obsidianIndexer;

    this.watcher = null;
    this.isWatching = false;
    this.debounceTimers = new Map();
    this.debounceMs = options.debounceMs || 300;
  }

  /**
   * Starts watching the configured Obsidian vault.
   */
  startWatching() {
    if (this.isWatching) return true;

    this.config.ensureDirectories();
    const vaultPath = path.resolve(this.config.vaultPath);

    if (!fs.existsSync(vaultPath)) {
      console.warn(`[OBSIDIAN_WATCHER] Vault directory does not exist: ${vaultPath}`);
      return false;
    }

    try {
      this.watcher = fs.watch(vaultPath, { recursive: true }, (eventType, filename) => {
        if (!filename) return;
        const fullPath = path.join(vaultPath, filename);

        // Security and exclusion checks
        if (!filename.toLowerCase().endsWith('.md')) return;
        if (!this.config.isPathSafe(fullPath)) return;
        if (this.config.isSymlinkEscape(fullPath)) return;

        this._handleDebouncedFileEvent(eventType, fullPath, filename);
      });

      this.isWatching = true;
      this.emit('started', { vaultPath });
      return true;
    } catch (err) {
      console.error('[OBSIDIAN_WATCHER_START_ERR]', err.message);
      this.isWatching = false;
      return false;
    }
  }

  /**
   * Debounces file write bursts (e.g. Obsidian autosave) before triggering indexing.
   */
  _handleDebouncedFileEvent(eventType, fullPath, filename) {
    if (this.debounceTimers.has(fullPath)) {
      clearTimeout(this.debounceTimers.get(fullPath));
    }

    const timer = setTimeout(async () => {
      this.debounceTimers.delete(fullPath);
      await this._processFileEvent(eventType, fullPath, filename);
    }, this.debounceMs);

    this.debounceTimers.set(fullPath, timer);
  }

  async _processFileEvent(eventType, fullPath, filename) {
    const vaultRoot = path.resolve(this.config.vaultPath);
    const relPath = path.relative(vaultRoot, fullPath).replace(/\\/g, '/');

    try {
      const exists = fs.existsSync(fullPath);

      if (exists) {
        // Created or Modified
        await this.indexer.indexFile(fullPath);
        this.emit('fileUpdated', { relativePath: relPath, fullPath });
      } else {
        // Deleted
        await this.indexer.deleteFile(relPath);
        this.emit('fileDeleted', { relativePath: relPath });
      }
    } catch (err) {
      console.warn(`[OBSIDIAN_WATCHER_PROCESS_WARN] ${relPath}:`, err.message);
    }
  }

  /**
   * Stops the filesystem watcher cleanly.
   */
  stopWatching() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    this.isWatching = false;
    this.emit('stopped');
  }

  getStatus() {
    return {
      isWatching: this.isWatching,
      vaultPath: this.config.vaultPath,
      debounceMs: this.debounceMs,
      pendingEvents: this.debounceTimers.size
    };
  }
}

export const obsidianWatcher = new ObsidianWatcher();
