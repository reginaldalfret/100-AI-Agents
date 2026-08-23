/**
 * Sovereign AI Workbench — Persistent Local Vector Index
 * Supports namespace partitioning (GLOBAL, AGENT, PROJECT, CONVERSATION, ATTACHMENT),
 * metadata filtering, cosine similarity search, and disk serialization in data/rag/vectors/.
 *
 * 100% On-Premise, Air-Gapped, Zero External Cloud Dependencies.
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { embeddingEngine, EMBEDDING_DIMENSION } from './embedding-engine.js';

export class VectorIndex {
  constructor(options = {}) {
    this.storageDir = options.storageDir || path.resolve(process.cwd(), 'data/rag/vectors');
    this.dimension = options.dimension || EMBEDDING_DIMENSION;
    this.embeddingEngine = options.embeddingEngine || embeddingEngine;
    
    // Chunk Registry: chunkId -> { chunk, vector: Float32Array }
    this.chunks = new Map();
    // Namespace Index: namespace -> Set<chunkId>
    this.namespaces = new Map();
    // Document Index: documentId -> Set<chunkId>
    this.documentIndex = new Map();

    this.isDirty = false;
    this._initStorage();
  }

  _initStorage() {
    try {
      if (fs.existsSync(this.storageDir)) {
        const files = fs.readdirSync(this.storageDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const raw = fs.readFileSync(path.join(this.storageDir, file), 'utf8');
            const data = JSON.parse(raw);
            if (Array.isArray(data.records)) {
              for (const record of data.records) {
                const vector = new Float32Array(record.vector);
                this._insertInMemory(record.chunk, vector);
              }
            }
          }
        }
      }
    } catch {
      // Graceful fallback for initial start
    }
  }

  _insertInMemory(chunk, vector) {
    const chunkId = chunk.chunkId;
    const ns = chunk.namespace || 'GLOBAL';
    const docId = chunk.documentId || 'doc_unknown';

    this.chunks.set(chunkId, { chunk, vector });

    if (!this.namespaces.has(ns)) {
      this.namespaces.set(ns, new Set());
    }
    this.namespaces.get(ns).add(chunkId);

    if (!this.documentIndex.has(docId)) {
      this.documentIndex.set(docId, new Set());
    }
    this.documentIndex.get(docId).add(chunkId);
  }

  /**
   * Adds an array of chunks to the vector index, computing vectors if not provided.
   * @param {Array<Object>} chunks - Array of chunk objects.
   * @param {Array<Float32Array>} [vectors] - Optional precomputed vectors.
   * @returns {number} Number of chunks indexed.
   */
  async addChunks(chunks, vectors = null) {
    if (!Array.isArray(chunks) || chunks.length === 0) return 0;

    for (let i = 0; i < chunks.length; i++) {
      const chk = chunks[i];
      const vec = vectors && vectors[i] 
        ? vectors[i] 
        : this.embeddingEngine.embed(chk.enrichedText || chk.text, { chunkHash: chk.chunkHash });

      this._insertInMemory(chk, vec);
    }

    this.isDirty = true;
    await this.persist();
    return chunks.length;
  }

  /**
   * Performs dense semantic cosine similarity search.
   * @param {string|Float32Array} query - Query text or query vector.
   * @param {Object} options - { topK, minScore, namespace, documentId, fileType, filter }
   * @returns {Array<Object>} Ranked search results with similarity scores.
   */
  search(query, options = {}) {
    const topK = options.topK || 5;
    const minScore = options.minScore || 0.0;
    const targetNs = options.namespace || null;
    const targetDocId = options.documentId || null;
    const targetFileType = options.fileType || null;
    const filterFn = typeof options.filter === 'function' ? options.filter : null;

    let queryVector;
    if (query instanceof Float32Array) {
      queryVector = query;
    } else if (typeof query === 'string') {
      queryVector = this.embeddingEngine.embed(query);
    } else {
      return [];
    }

    // Determine candidate chunk IDs based on namespace/document scoping
    let candidateIds;
    if (targetDocId && this.documentIndex.has(targetDocId)) {
      candidateIds = this.documentIndex.get(targetDocId);
    } else if (targetNs && this.namespaces.has(targetNs)) {
      candidateIds = this.namespaces.get(targetNs);
    } else {
      candidateIds = this.chunks.keys();
    }

    const scoredResults = [];

    for (const chunkId of candidateIds) {
      const entry = this.chunks.get(chunkId);
      if (!entry) continue;

      const { chunk, vector } = entry;

      // Metadata filtering
      if (targetNs && chunk.namespace !== targetNs) continue;
      if (targetDocId && chunk.documentId !== targetDocId) continue;
      if (targetFileType && chunk.fileType !== targetFileType) continue;
      if (filterFn && !filterFn(chunk)) continue;

      // Cosine similarity
      const score = this.embeddingEngine.cosineSimilarity(queryVector, vector);

      if (score >= minScore) {
        scoredResults.push({
          ...chunk,
          vectorScore: score,
          score
        });
      }
    }

    // Rank descending by score
    scoredResults.sort((a, b) => b.score - a.score);
    return scoredResults.slice(0, topK);
  }

  /**
   * Removes all chunks associated with a document ID.
   */
  async removeDocument(documentId, namespace = null) {
    if (!this.documentIndex.has(documentId)) return 0;

    const chunkIds = Array.from(this.documentIndex.get(documentId));
    let removedCount = 0;

    for (const id of chunkIds) {
      const entry = this.chunks.get(id);
      if (entry) {
        const ns = entry.chunk.namespace;
        if (!namespace || namespace === ns) {
          this.chunks.delete(id);
          if (this.namespaces.has(ns)) {
            this.namespaces.get(ns).delete(id);
          }
          removedCount++;
        }
      }
    }

    this.documentIndex.delete(documentId);
    this.isDirty = true;
    await this.persist();
    return removedCount;
  }

  /**
   * Clears the index entirely or for a specific namespace.
   */
  async clear(namespace = null) {
    if (namespace) {
      if (this.namespaces.has(namespace)) {
        const ids = Array.from(this.namespaces.get(namespace));
        for (const id of ids) {
          const entry = this.chunks.get(id);
          if (entry) {
            const docId = entry.chunk.documentId;
            if (this.documentIndex.has(docId)) {
              this.documentIndex.get(docId).delete(id);
            }
            this.chunks.delete(id);
          }
        }
        this.namespaces.delete(namespace);
      }
    } else {
      this.chunks.clear();
      this.namespaces.clear();
      this.documentIndex.clear();
    }

    this.isDirty = true;
    await this.persist();
  }

  /**
   * Persists vectors and metadata safely to disk in data/rag/vectors/
   */
  async persist() {
    if (!this.isDirty) return;

    try {
      await fsp.mkdir(this.storageDir, { recursive: true });

      // Group records by namespace
      const nsGroups = {};
      for (const [chunkId, { chunk, vector }] of this.chunks.entries()) {
        const ns = chunk.namespace || 'GLOBAL';
        if (!nsGroups[ns]) nsGroups[ns] = [];
        nsGroups[ns].push({
          chunk,
          vector: Array.from(vector)
        });
      }

      for (const [ns, records] of Object.entries(nsGroups)) {
        const targetPath = path.join(this.storageDir, `index_${ns}.json`);
        const tempPath = path.join(this.storageDir, `index_${ns}.tmp`);

        const payload = JSON.stringify({
          namespace: ns,
          version: '1.0.0',
          updatedAt: new Date().toISOString(),
          totalRecords: records.length,
          records
        });

        await fsp.writeFile(tempPath, payload, 'utf8');
        await fsp.rename(tempPath, targetPath);
      }

      this.isDirty = false;
    } catch {
      // Persistence error handled safely
    }
  }

  getStats() {
    const nsCounts = {};
    for (const [ns, set] of this.namespaces.entries()) {
      nsCounts[ns] = set.size;
    }

    return {
      totalChunks: this.chunks.size,
      totalDocuments: this.documentIndex.size,
      dimension: this.dimension,
      namespaces: nsCounts,
      approximateMemoryBytes: this.chunks.size * (this.dimension * 4 + 1024)
    };
  }
}

export const vectorIndex = new VectorIndex();
