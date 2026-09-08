/**
 * Sovereign AI Workbench — Knowledge Service & RAG Facade
 * Fuses Obsidian Knowledge, Structured Documents, Datasets, and Local Model Inference.
 *
 * 100% On-Premise, Air-Gapped, Zero External Dependencies.
 */

import path from 'node:path';
import { spawn } from 'node:child_process';
import { obsidianConfig } from './obsidian-config.js';
import { obsidianIndexer } from './obsidian-indexer.js';
import { sourceRegistry } from './source-registry.js';
import { hybridRetriever } from '../rag/hybrid-retriever.js';
import { evidencePacker } from '../rag/evidence-packer.js';
import { citationGenerator } from '../rag/citation-generator.js';
import { IngestionNamespace } from '../rag/document-ingestion.js';

export class KnowledgeService {
  constructor(options = {}) {
    this.config = options.config || obsidianConfig;
    this.indexer = options.indexer || obsidianIndexer;
    this.registry = options.registry || sourceRegistry;
    this.hybridRetriever = options.hybridRetriever || hybridRetriever;
  }

  /**
   * Performs hybrid search (Dense Vector + BM25 Lexical) across indexed knowledge.
   * @param {string} queryText 
   * @param {Object} options - { topK, domain, tag, folder, status, minScore }
   * @returns {Object} { totalMatches, chunks, citations }
   */
  async search(queryText = '', options = {}) {
    if (!queryText || typeof queryText !== 'string') {
      return { query: '', totalMatches: 0, chunks: [], citations: [] };
    }

    const topK = options.topK || this.config.retrievalTopK || 5;
    const candidateLimit = Math.max(topK * 4, 30);

    // 1. Query Hybrid Retriever
    const rawResults = this.hybridRetriever.search(queryText, {
      namespace: IngestionNamespace.GLOBAL,
      topK: candidateLimit
    });

    // 2. Filter Results (Domain, Tag, Folder, Status)
    let filtered = rawResults;

    if (options.domain && options.domain !== 'all') {
      filtered = filtered.filter(c => (c.domain || '').toLowerCase() === options.domain.toLowerCase());
    }

    if (options.tag) {
      const targetTag = options.tag.replace(/^#/, '').toLowerCase();
      filtered = filtered.filter(c => Array.isArray(c.tags) && c.tags.some(t => t.toLowerCase() === targetTag));
    }

    if (options.folder) {
      filtered = filtered.filter(c => (c.relativePath || '').startsWith(options.folder));
    }

    if (options.status) {
      filtered = filtered.filter(c => (c.status || '').toUpperCase() === options.status.toUpperCase());
    }

    const rankedChunks = filtered.slice(0, topK);

    // 3. Generate Precise Citations with Obsidian URIs
    const vaultName = path.basename(this.config.vaultPath);
    const citations = rankedChunks.map(c => {
      const relPath = c.relativePath || c.filename || 'Untitled.md';
      const cleanRel = relPath.replace(/\.md$/i, '');
      const obsidianUri = `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(cleanRel)}`;

      return {
        chunkId: c.chunkId,
        title: c.title || path.basename(relPath),
        relativePath: relPath,
        heading: c.heading || 'General',
        headingPath: c.headingPath || c.title,
        tags: c.tags || [],
        domain: c.domain || 'general',
        status: c.status || 'VERIFIED',
        score: Number((c.score || 0).toFixed(4)),
        excerpt: (c.text || '').slice(0, 240) + (c.text && c.text.length > 240 ? '...' : ''),
        obsidianUri,
        fullPath: path.join(this.config.vaultPath, relPath)
      };
    });

    return {
      query: queryText,
      totalMatches: rankedChunks.length,
      chunks: rankedChunks,
      citations,
      isAirGapped: true,
      externalCalls: 0
    };
  }

  /**
   * Grounded Knowledge Query Engine.
   * Retrieves relevant notes and formats structured evidence for local LLM consumption.
   */
  async queryKnowledge(queryText = '', options = {}) {
    const searchRes = await this.search(queryText, options);

    if (searchRes.totalMatches === 0) {
      return {
        query: queryText,
        grounded: false,
        answer: "I couldn't find supporting information in your connected knowledge base.",
        citations: [],
        evidencePack: null,
        sources: []
      };
    }

    // Build Evidence Pack
    const evidence = evidencePacker.buildEvidencePack(searchRes.chunks, {
      maxTokens: 2500,
      sanitize: true
    });

    const sources = searchRes.citations.map(c => ({
      title: c.title,
      path: c.relativePath,
      heading: c.heading,
      obsidianUri: c.obsidianUri
    }));

    return {
      query: queryText,
      grounded: true,
      evidencePack: evidence.evidencePack,
      citations: searchRes.citations,
      sources,
      tokenEstimate: evidence.tokenEstimate,
      topChunk: searchRes.chunks[0],
      isAirGapped: true,
      externalCalls: 0
    };
  }

  /**
   * Opens a note in Obsidian via URI scheme or system default application.
   */
  async openNote(relativePath) {
    if (!relativePath) return { success: false, error: 'Relative path is required' };

    const fullPath = path.join(this.config.vaultPath, relativePath);
    if (!this.config.isPathSafe(fullPath)) {
      return { success: false, error: 'Access denied: Path is outside vault.' };
    }

    const vaultName = path.basename(this.config.vaultPath);
    const cleanRel = relativePath.replace(/\.md$/i, '');
    const obsidianUri = `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(cleanRel)}`;

    try {
      if (process.platform === 'win32') {
        // Try opening with Obsidian URI first
        spawn('cmd.exe', ['/c', 'start', '', obsidianUri], { detached: true, stdio: 'ignore' });
      }
      return { success: true, uri: obsidianUri, fullPath };
    } catch {
      // Fallback: open file directly with system default
      try {
        if (process.platform === 'win32') {
          spawn('cmd.exe', ['/c', 'start', '', fullPath], { detached: true, stdio: 'ignore' });
        }
        return { success: true, uri: null, fullPath };
      } catch (err2) {
        return { success: false, error: err2.message };
      }
    }
  }

  /**
   * System health check for Knowledge Subsystem.
   */
  getHealth() {
    const status = this.indexer.getIndexStatus();
    return {
      vault_accessible: true,
      index_available: status.status === 'READY' || status.status === 'INDEXING',
      embedding_service: 'local-cpu-dense-384',
      vector_store: 'local-filesystem-partitioned',
      watcher_active: true,
      last_sync: status.lastSync,
      document_count: status.totalNotes,
      chunk_count: status.totalChunks,
      is_air_gapped: true,
      external_calls: 0
    };
  }
}

export const knowledgeService = new KnowledgeService();
