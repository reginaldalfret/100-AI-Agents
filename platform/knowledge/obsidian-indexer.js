/**
 * Sovereign AI Workbench — Obsidian Incremental Knowledge Indexer & Graph Engine
 * 100% On-Premise, Air-Gapped, Zero External Network Calls, E: Drive Storage Policy.
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { obsidianConfig } from './obsidian-config.js';
import { MarkdownParser } from './markdown-parser.js';
import { hybridRetriever } from '../rag/hybrid-retriever.js';
import { embeddingEngine } from '../rag/embedding-engine.js';
import { IngestionNamespace } from '../rag/document-ingestion.js';

export class ObsidianIndexer {
  constructor(options = {}) {
    this.config = options.config || obsidianConfig;
    this.hybridRetriever = options.hybridRetriever || hybridRetriever;
    this.embeddingEngine = options.embeddingEngine || embeddingEngine;

    this.manifestPath = path.join(this.config.indexDir, 'obsidian-manifest.json');
    this.graphPath = path.join(this.config.indexDir, 'obsidian-graph.json');

    // Note Registry: relativePath -> NoteMetadata
    this.notes = new Map();
    // Link Graph: sourceRelativePath -> Array<{ target, alias, anchor }>
    this.linkGraph = new Map();
    // Chunks tracking: relativePath -> Array<chunkId>
    this.fileChunks = new Map();

    this.isIndexing = false;
    this.indexingProgress = {
      current: 0,
      total: 0,
      phase: 'idle', // scanning | chunking | embedding | ready
      lastError: null
    };
    this.lastSync = null;

    this._loadManifest();
  }

  _loadManifest() {
    try {
      if (fs.existsSync(this.manifestPath)) {
        const raw = fs.readFileSync(this.manifestPath, 'utf8');
        const data = JSON.parse(raw);
        if (data.notes && typeof data.notes === 'object') {
          for (const [rel, meta] of Object.entries(data.notes)) {
            this.notes.set(rel, meta);
          }
        }
        if (data.fileChunks && typeof data.fileChunks === 'object') {
          for (const [rel, cIds] of Object.entries(data.fileChunks)) {
            this.fileChunks.set(rel, cIds);
          }
        }
        if (data.lastSync) this.lastSync = data.lastSync;
      }

      if (fs.existsSync(this.graphPath)) {
        const raw = fs.readFileSync(this.graphPath, 'utf8');
        const data = JSON.parse(raw);
        if (data.links && typeof data.links === 'object') {
          for (const [src, links] of Object.entries(data.links)) {
            this.linkGraph.set(src, links);
          }
        }
      }
    } catch (err) {
      console.warn('[OBSIDIAN_INDEX_MANIFEST_LOAD_WARN]', err.message);
    }
  }

  async _saveManifest() {
    try {
      this.config.ensureDirectories();

      const manifestData = {
        vaultPath: this.config.vaultPath,
        updatedAt: new Date().toISOString(),
        lastSync: this.lastSync,
        totalNotes: this.notes.size,
        totalChunks: Array.from(this.fileChunks.values()).reduce((sum, arr) => sum + arr.length, 0),
        notes: Object.fromEntries(this.notes),
        fileChunks: Object.fromEntries(this.fileChunks)
      };
      await fsp.writeFile(this.manifestPath, JSON.stringify(manifestData, null, 2), 'utf8');

      const nodes = Array.from(this.notes.values()).map(n => ({
        id: n.title,
        relativePath: n.relativePath,
        tags: n.tags || []
      }));
      const edges = [];
      for (const [src, links] of this.linkGraph.entries()) {
        (links || []).forEach(l => {
          edges.push({ source: src, target: l.target || l });
        });
      }

      const graphData = {
        updatedAt: new Date().toISOString(),
        totalLinks: edges.length,
        nodes,
        edges,
        links: Object.fromEntries(this.linkGraph)
      };
      await fsp.writeFile(this.graphPath, JSON.stringify(graphData, null, 2), 'utf8');
    } catch (err) {
      console.warn('[OBSIDIAN_INDEX_MANIFEST_SAVE_WARN]', err.message);
    }
  }

  /**
   * Synchronously or asynchronously discovers markdown files in directory.
   */
  discoverMarkdownFiles(dir) {
    const targetDir = dir || this.config.vaultPath;
    const results = [];
    const walk = (d) => {
      if (!fs.existsSync(d)) return;
      const entries = fs.readdirSync(d, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(d, entry.name);
        if (entry.name.startsWith('.') || entry.name === '.obsidian' || entry.name === '.trash') continue;
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
          results.push(fullPath);
        }
      }
    };
    walk(targetDir);
    return results;
  }

  /**
   * Scans the vault directory recursively and returns all safe .md file paths.
   */
  async scanVault() {
    this.config.ensureDirectories();
    const vaultRoot = path.resolve(this.config.vaultPath);
    const results = [];

    const walk = async (dir) => {
      let entries = [];
      try {
        entries = await fsp.readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (!this.config.isPathSafe(fullPath) || this.config.isSymlinkEscape(fullPath)) {
          continue;
        }

        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
          results.push(fullPath);
        }
      }
    };

    await walk(vaultRoot);
    return results;
  }

  /**
   * Alias for incremental vault synchronization.
   */
  async syncIncremental() {
    return this.syncVault();
  }

  /**
   * Performs an incremental synchronization of the Obsidian vault.
   * Only re-indexes new and modified files; cleans up deleted files.
   */
  async syncVault() {
    if (this.isIndexing) {
      return { status: 'busy', progress: this.indexingProgress };
    }

    this.isIndexing = true;
    this.indexingProgress = { current: 0, total: 0, phase: 'scanning', lastError: null };

    const summary = {
      added: 0,
      updated: 0,
      deleted: 0,
      unchanged: 0,
      errors: 0,
      totalNotes: 0,
      totalChunks: 0
    };

    try {
      const diskFiles = await this.scanVault();
      const diskRelPaths = new Set();
      const vaultRoot = path.resolve(this.config.vaultPath);

      this.indexingProgress.total = diskFiles.length;
      this.indexingProgress.phase = 'indexing';

      // 1. Check each file on disk
      for (let i = 0; i < diskFiles.length; i++) {
        const fullPath = diskFiles[i];
        const relPath = path.relative(vaultRoot, fullPath).replace(/\\/g, '/');
        diskRelPaths.add(relPath);
        this.indexingProgress.current = i + 1;

        try {
          const stat = await fsp.stat(fullPath);
          const content = await fsp.readFile(fullPath, 'utf8');
          const contentHash = crypto.createHash('sha256').update(content, 'utf8').digest('hex');

          const existing = this.notes.get(relPath);

          if (!existing) {
            // New Note
            await this.indexFileContent(fullPath, relPath, content, contentHash, stat.mtimeMs);
            summary.added++;
          } else if (existing.contentHash !== contentHash || existing.mtime !== stat.mtimeMs) {
            // Modified Note
            await this.deleteFileChunks(relPath);
            await this.indexFileContent(fullPath, relPath, content, contentHash, stat.mtimeMs);
            summary.updated++;
          } else {
            // Unchanged Note
            summary.unchanged++;
          }
        } catch (err) {
          summary.errors++;
          console.warn(`[OBSIDIAN_INDEX_FILE_ERR] ${relPath}:`, err.message);
        }
      }

      // 2. Detect Deleted Notes
      for (const knownRelPath of Array.from(this.notes.keys())) {
        if (!diskRelPaths.has(knownRelPath)) {
          await this.deleteFile(knownRelPath);
          summary.deleted++;
        }
      }

      this.lastSync = new Date().toISOString();
      await this._saveManifest();

      summary.totalNotes = this.notes.size;
      summary.totalChunks = Array.from(this.fileChunks.values()).reduce((sum, arr) => sum + arr.length, 0);

      this.indexingProgress.phase = 'ready';
      return {
        status: 'READY',
        success: true,
        summary,
        totalNotes: summary.totalNotes,
        totalChunks: summary.totalChunks,
        indexed: summary.added + summary.updated,
        unchanged: summary.unchanged,
        added: summary.added,
        updated: summary.updated,
        deleted: summary.deleted
      };
    } catch (err) {
      this.indexingProgress.phase = 'error';
      this.indexingProgress.lastError = err.message;
      throw err;
    } finally {
      this.isIndexing = false;
    }
  }

  /**
   * Indexes a single file's content into chunks, vector store, and BM25 index.
   */
  async indexFileContent(fullPath, relativePath, content, contentHash, mtime) {
    const filename = path.basename(fullPath);
    const parsed = MarkdownParser.parse(content, {
      filename,
      relativePath,
      title: filename.replace(/\.md$/i, '')
    });

    const docId = `obsidian_${crypto.createHash('sha256').update(relativePath).digest('hex').slice(0, 16)}`;
    const chunks = [];
    const chunkIds = [];

    // Construct Semantic Chunks from Sections
    parsed.sections.forEach((sec, idx) => {
      const chunkId = `${docId}_chk_${String(idx).padStart(4, '0')}`;
      const contextPrefix = `[Obsidian Note: ${parsed.title} | Path: ${relativePath} | Section: ${sec.heading}]`;
      const enrichedText = `${contextPrefix}\n${sec.content}`;
      const chunkHash = crypto.createHash('sha256').update(`${docId}:${enrichedText}`).digest('hex');

      const chunkObj = {
        chunkId,
        documentId: docId,
        filename,
        relativePath,
        sourceType: 'OBSIDIAN',
        title: parsed.title,
        heading: sec.heading,
        headingPath: sec.headingPath,
        namespace: IngestionNamespace.GLOBAL,
        tags: parsed.tags,
        domain: parsed.frontmatter.domain || 'general',
        status: (parsed.frontmatter.status || 'VERIFIED').toUpperCase(),
        frontmatter: parsed.frontmatter,
        text: sec.content,
        enrichedText,
        chunkHash,
        tokenEstimate: Math.ceil(enrichedText.length / 4),
        charCount: enrichedText.length,
        createdAt: new Date(mtime).toISOString()
      };

      chunks.push(chunkObj);
      chunkIds.push(chunkId);
    });

    // Ingest chunks into Local Hybrid Retriever (Dense Vector + BM25)
    if (chunks.length > 0) {
      await this.hybridRetriever.addChunks(chunks);
    }

    // Update Note Registry
    this.notes.set(relativePath, {
      title: parsed.title,
      filename,
      relativePath,
      fullPath,
      contentHash,
      mtime,
      charCount: parsed.charCount,
      wordCount: parsed.wordCount,
      headings: parsed.headings.map(h => h.text),
      tags: parsed.tags,
      frontmatter: parsed.frontmatter,
      chunkCount: chunks.length,
      indexedAt: new Date().toISOString()
    });

    // Update Link Graph
    if (parsed.wikilinks.length > 0) {
      this.linkGraph.set(relativePath, parsed.wikilinks);
    } else {
      this.linkGraph.delete(relativePath);
    }

    // Update File Chunks
    this.fileChunks.set(relativePath, chunkIds);
  }

  /**
   * Deletes chunks associated with a file from both indices.
   */
  async deleteFileChunks(relativePath) {
    const chunkIds = this.fileChunks.get(relativePath);
    if (!chunkIds || chunkIds.length === 0) return;

    const docId = `obsidian_${crypto.createHash('sha256').update(relativePath).digest('hex').slice(0, 16)}`;
    await this.hybridRetriever.removeDocument(docId);
    this.fileChunks.delete(relativePath);
  }

  /**
   * Deletes a note and its chunks completely.
   */
  async deleteFile(relativePath) {
    await this.deleteFileChunks(relativePath);
    this.notes.delete(relativePath);
    this.linkGraph.delete(relativePath);
    await this._saveManifest();
  }

  /**
   * Single file incremental indexer.
   */
  async indexFile(fullPath) {
    if (!this.config.isPathSafe(fullPath)) return false;
    const vaultRoot = path.resolve(this.config.vaultPath);
    const relPath = path.relative(vaultRoot, fullPath).replace(/\\/g, '/');

    const stat = await fsp.stat(fullPath);
    const content = await fsp.readFile(fullPath, 'utf8');
    const contentHash = crypto.createHash('sha256').update(content, 'utf8').digest('hex');

    await this.deleteFileChunks(relPath);
    await this.indexFileContent(fullPath, relPath, content, contentHash, stat.mtimeMs);
    await this._saveManifest();
    return true;
  }

  /**
   * Completely rebuilds the index from scratch.
   */
  async rebuildIndex() {
    if (this.isIndexing) {
      throw new Error('Indexing is already in progress.');
    }

    // Clear all existing obsidian chunks
    for (const relPath of Array.from(this.fileChunks.keys())) {
      await this.deleteFileChunks(relPath);
    }

    this.notes.clear();
    this.linkGraph.clear();
    this.fileChunks.clear();

    return await this.syncVault();
  }

  /**
   * Returns live indexing status.
   */
  getIndexStatus() {
    const totalChunks = Array.from(this.fileChunks.values()).reduce((sum, arr) => sum + arr.length, 0);
    return {
      vaultPath: this.config.vaultPath,
      isIndexing: this.isIndexing,
      progress: this.indexingProgress,
      totalNotes: this.notes.size,
      totalChunks,
      totalLinks: Array.from(this.linkGraph.values()).reduce((sum, arr) => sum + arr.length, 0),
      lastSync: this.lastSync,
      status: this.isIndexing ? 'INDEXING' : (this.notes.size > 0 ? 'READY' : 'EMPTY'),
      embeddingModel: this.config.embeddingModel,
      isAirGapped: true,
      externalCalls: 0
    };
  }

  /**
   * Returns list of all indexed notes with metadata.
   */
  listNotes() {
    return Array.from(this.notes.values());
  }

  /**
   * Returns link graph connections for visualization.
   */
  getGraph() {
    return Object.fromEntries(this.linkGraph);
  }
}

export const obsidianIndexer = new ObsidianIndexer();
