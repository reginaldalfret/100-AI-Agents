/**
 * Sovereign AI Workbench — Repository & Codebase Indexer
 * Scans, normalizes, and indexes workspace code, architecture docs, and agent contracts
 * into the PROJECT RAG namespace for Agent 101 codebase intelligence.
 *
 * 100% On-Premise, Air-Gapped, Zero External Cloud Dependencies.
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { documentIngestion } from './document-ingestion.js';
import { chunker } from './chunker.js';
import { vectorIndex } from './vector-index.js';
import { bm25Engine } from './bm25-engine.js';

export class CodebaseIndexer {
  constructor(options = {}) {
    this.workspaceRoot = options.workspaceRoot || process.cwd();
    this.namespace = options.namespace || 'PROJECT';
    this.documentIngestion = options.documentIngestion || documentIngestion;
    this.chunker = options.chunker || chunker;
    this.vectorIndex = options.vectorIndex || vectorIndex;
    this.bm25Engine = options.bm25Engine || bm25Engine;
    
    // File state tracker for incremental indexing
    this.fileState = new Map(); // filePath -> { mtime, hash, chunkIds }
    this.ignoreDirs = new Set([
      'node_modules', '.git', 'cache', 'temp', 'logs', 'archive',
      'artifacts', 'scratch', 'dist', 'coverage', '.vscode', '.idea'
    ]);
    this.targetExtensions = new Set([
      '.js', '.mjs', '.cjs', '.json', '.md', '.py', '.sql', '.html', '.css',
      '.yaml', '.yml', '.sh', '.ps1', '.c', '.cpp', '.rs', '.go', '.java'
    ]);
  }

  /**
   * Scans and indexes the repository.
   * @param {Object} options - { targetDirs, targetFiles, forceReindex }
   * @returns {Promise<Object>} Indexing execution report.
   */
  async indexRepository(options = {}) {
    const startTime = Date.now();
    const targetDirs = options.targetDirs || ['platform', 'agents', 'docs', 'agent-contract'];
    const targetFiles = options.targetFiles || ['README.md', 'package.json'];
    const force = options.forceReindex || false;

    let indexedFiles = 0;
    let indexedChunks = 0;
    let skippedFiles = 0;
    const errors = [];

    // 1. Index root individual files
    for (const file of targetFiles) {
      const fullPath = path.resolve(this.workspaceRoot, file);
      try {
        if (fs.existsSync(fullPath)) {
          const res = await this._indexSingleFile(fullPath, force);
          if (res.skipped) skippedFiles++;
          else {
            indexedFiles++;
            indexedChunks += res.chunkCount;
          }
        }
      } catch (err) {
        errors.push({ file, error: err.message });
      }
    }

    // 2. Index target directories recursively
    for (const dir of targetDirs) {
      const fullDir = path.resolve(this.workspaceRoot, dir);
      if (!fs.existsSync(fullDir)) continue;

      const discoveredFiles = await this._walkDirectory(fullDir);
      for (const file of discoveredFiles) {
        try {
          const res = await this._indexSingleFile(file, force);
          if (res.skipped) skippedFiles++;
          else {
            indexedFiles++;
            indexedChunks += res.chunkCount;
          }
        } catch (err) {
          errors.push({ file, error: err.message });
        }
      }
    }

    const durationMs = Date.now() - startTime;

    return {
      success: errors.length === 0,
      indexedFiles,
      indexedChunks,
      skippedFiles,
      errors,
      durationMs,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Indexes a single file into the PROJECT namespace.
   */
  async _indexSingleFile(filePath, force = false) {
    const stat = await fsp.stat(filePath);
    const mtime = stat.mtimeMs;
    const relativePath = path.relative(this.workspaceRoot, filePath).replace(/\\/g, '/');

    // Check incremental state
    if (!force && this.fileState.has(relativePath)) {
      const prev = this.fileState.get(relativePath);
      if (prev.mtime === mtime) {
        return { skipped: true, chunkCount: 0 };
      }
    }

    const buffer = await fsp.readFile(filePath);
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    if (!force && this.fileState.has(relativePath)) {
      const prev = this.fileState.get(relativePath);
      if (prev.hash === sha256) {
        this.fileState.set(relativePath, { mtime, hash: sha256, chunkIds: prev.chunkIds });
        return { skipped: true, chunkCount: 0 };
      }
    }

    // Normalize document
    const doc = await this.documentIngestion.ingestFile(filePath, {
      namespace: this.namespace,
      documentId: `repo_${sha256.slice(0, 16)}`,
      tags: ['codebase', path.extname(filePath).slice(1)],
      customMetadata: { relativePath }
    });

    // Chunk document
    const chunks = this.chunker.chunkDocument(doc);
    if (chunks.length === 0) {
      return { skipped: false, chunkCount: 0 };
    }

    // Update vector and BM25 indexes
    await Promise.all([
      this.vectorIndex.addChunks(chunks),
      this.bm25Engine.addChunks(chunks)
    ]);

    const chunkIds = chunks.map(c => c.chunkId);
    this.fileState.set(relativePath, { mtime, hash: sha256, chunkIds });

    return { skipped: false, chunkCount: chunks.length };
  }

  /**
   * Recursively walks directory ignoring build & temporary folders.
   */
  async _walkDirectory(dirPath) {
    const results = [];
    const entries = await fsp.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        if (!this.ignoreDirs.has(entry.name) && !entry.name.startsWith('.')) {
          const subFiles = await this._walkDirectory(fullPath);
          results.push(...subFiles);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (this.targetExtensions.has(ext)) {
          results.push(fullPath);
        }
      }
    }

    return results;
  }

  getStats() {
    return {
      indexedFilesTracked: this.fileState.size,
      workspaceRoot: this.workspaceRoot,
      namespace: this.namespace
    };
  }
}

export const codebaseIndexer = new CodebaseIndexer();
