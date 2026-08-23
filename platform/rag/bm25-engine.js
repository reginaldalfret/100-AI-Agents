/**
 * Sovereign AI Workbench — Okapi BM25 Lexical & Exact Token Search Engine
 * Full Okapi BM25 implementation with TF, IDF, document length normalization (k1=1.5, b=0.75),
 * inverted index, code symbol splitting, and exact keyword/phrase boosting.
 *
 * 100% On-Premise, Air-Gapped, Zero External Cloud Dependencies.
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

export class BM25Engine {
  constructor(options = {}) {
    this.k1 = options.k1 ?? 1.5;
    this.b = options.b ?? 0.75;
    this.storageDir = options.storageDir || path.resolve(process.cwd(), 'data/rag/bm25');

    // Inverted Index: term -> Map<chunkId, { tf, positions }>
    this.invertedIndex = new Map();
    // Document Length Registry: chunkId -> docLength
    this.docLengths = new Map();
    // Chunk Registry: chunkId -> chunk
    this.chunks = new Map();
    // Namespace index: namespace -> Set<chunkId>
    this.namespaces = new Map();
    // Document Index: documentId -> Set<chunkId>
    this.documentIndex = new Map();

    this.totalDocs = 0;
    this.totalTokens = 0;
    this.avgDocLength = 0;
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
            if (Array.isArray(data.chunks)) {
              for (const chk of data.chunks) {
                this._insertInMemory(chk);
              }
            }
          }
        }
      }
    } catch {
      // Graceful fallback on fresh start
    }
  }

  _insertInMemory(chunk) {
    const chunkId = chunk.chunkId;
    const ns = chunk.namespace || 'GLOBAL';
    const docId = chunk.documentId || 'doc_unknown';
    const text = chunk.enrichedText || chunk.text || '';

    const tokens = this._tokenize(text);
    const docLen = tokens.length;

    this.chunks.set(chunkId, chunk);
    this.docLengths.set(chunkId, docLen);

    if (!this.namespaces.has(ns)) {
      this.namespaces.set(ns, new Set());
    }
    this.namespaces.get(ns).add(chunkId);

    if (!this.documentIndex.has(docId)) {
      this.documentIndex.set(docId, new Set());
    }
    this.documentIndex.get(docId).add(chunkId);

    // Compute TF and inverted postings
    const termCounts = new Map();
    tokens.forEach((term, pos) => {
      if (!termCounts.has(term)) {
        termCounts.set(term, { tf: 0, positions: [] });
      }
      const entry = termCounts.get(term);
      entry.tf += 1;
      entry.positions.push(pos);
    });

    for (const [term, posting] of termCounts.entries()) {
      if (!this.invertedIndex.has(term)) {
        this.invertedIndex.set(term, new Map());
      }
      this.invertedIndex.get(term).set(chunkId, posting);
    }

    this.totalDocs = this.chunks.size;
    this.totalTokens += docLen;
    this.avgDocLength = this.totalDocs > 0 ? this.totalTokens / this.totalDocs : 0;
  }

  /**
   * Adds an array of chunks to the BM25 inverted index.
   * @param {Array<Object>} chunks - Array of chunk objects.
   * @returns {number} Count of indexed chunks.
   */
  async addChunks(chunks) {
    if (!Array.isArray(chunks) || chunks.length === 0) return 0;

    for (const chk of chunks) {
      this._insertInMemory(chk);
    }

    this.isDirty = true;
    await this.persist();
    return chunks.length;
  }

  /**
   * Searches the BM25 inverted index with Okapi BM25 scoring and exact term boosting.
   * @param {string} query - Query string.
   * @param {Object} options - { topK, namespace, documentId, fileType, filter }
   * @returns {Array<Object>} Ranked chunks with BM25 scores.
   */
  search(query, options = {}) {
    if (!query || typeof query !== 'string') return [];

    const topK = options.topK || 5;
    const targetNs = options.namespace || null;
    const targetDocId = options.documentId || null;
    const targetFileType = options.fileType || null;
    const filterFn = typeof options.filter === 'function' ? options.filter : null;

    const queryTokens = this._tokenize(query);
    if (queryTokens.length === 0) return [];

    const queryLower = query.toLowerCase().trim();
    const scores = new Map();

    const N = this.totalDocs || 1;
    const avgdl = this.avgDocLength || 1;

    for (const qTerm of queryTokens) {
      if (!this.invertedIndex.has(qTerm)) continue;

      const postings = this.invertedIndex.get(qTerm);
      const n_q = postings.size;

      // Okapi BM25 IDF formulation: ln(1 + (N - n(q) + 0.5) / (n(q) + 0.5))
      const idf = Math.log(1 + (N - n_q + 0.5) / (n_q + 0.5));

      for (const [chunkId, posting] of postings.entries()) {
        const chunk = this.chunks.get(chunkId);
        if (!chunk) continue;

        // Scoping & Metadata filters
        if (targetNs && chunk.namespace !== targetNs) continue;
        if (targetDocId && chunk.documentId !== targetDocId) continue;
        if (targetFileType && chunk.fileType !== targetFileType) continue;
        if (filterFn && !filterFn(chunk)) continue;

        const tf = posting.tf;
        const dl = this.docLengths.get(chunkId) || avgdl;

        // BM25 term score component
        const numerator = tf * (this.k1 + 1);
        const denominator = tf + this.k1 * (1 - this.b + this.b * (dl / avgdl));
        const termScore = idf * (numerator / denominator);

        scores.set(chunkId, (scores.get(chunkId) || 0) + termScore);
      }
    }

    if (scores.size === 0) return [];

    // Exact phrase & symbol boost
    const results = [];
    for (const [chunkId, bm25Score] of scores.entries()) {
      const chunk = this.chunks.get(chunkId);
      const rawText = (chunk.enrichedText || chunk.text || '').toLowerCase();
      
      let finalScore = bm25Score;

      // Boost if exact query string is found verbatim
      if (queryLower.length > 4 && rawText.includes(queryLower)) {
        finalScore += 2.5;
      }

      // Boost if technical symbols match
      const technicalMatches = queryTokens.filter(t => t.length > 3 && rawText.includes(t));
      if (technicalMatches.length === queryTokens.length) {
        finalScore += 1.5;
      }

      results.push({
        ...chunk,
        bm25Score: finalScore,
        score: finalScore
      });
    }

    // Sort descending by BM25 score
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  /**
   * Removes all chunks for a document ID from the inverted index.
   */
  async removeDocument(documentId, namespace = null) {
    if (!this.documentIndex.has(documentId)) return 0;

    const chunkIds = Array.from(this.documentIndex.get(documentId));
    let removedCount = 0;

    for (const id of chunkIds) {
      const chunk = this.chunks.get(id);
      if (chunk) {
        const ns = chunk.namespace;
        if (!namespace || namespace === ns) {
          // Remove from inverted index
          for (const [term, postings] of this.invertedIndex.entries()) {
            if (postings.has(id)) {
              postings.delete(id);
              if (postings.size === 0) {
                this.invertedIndex.delete(term);
              }
            }
          }

          const docLen = this.docLengths.get(id) || 0;
          this.totalTokens -= docLen;
          this.docLengths.delete(id);
          this.chunks.delete(id);

          if (this.namespaces.has(ns)) {
            this.namespaces.get(ns).delete(id);
          }
          removedCount++;
        }
      }
    }

    this.documentIndex.delete(documentId);
    this.totalDocs = this.chunks.size;
    this.avgDocLength = this.totalDocs > 0 ? this.totalTokens / this.totalDocs : 0;
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
          const chunk = this.chunks.get(id);
          if (chunk) {
            this.removeDocument(chunk.documentId, namespace);
          }
        }
        this.namespaces.delete(namespace);
      }
    } else {
      this.invertedIndex.clear();
      this.docLengths.clear();
      this.chunks.clear();
      this.namespaces.clear();
      this.documentIndex.clear();
      this.totalDocs = 0;
      this.totalTokens = 0;
      this.avgDocLength = 0;
    }

    this.isDirty = true;
    await this.persist();
  }

  /**
   * Tokenizer with code symbol splitting (camelCase & snake_case) and punctuation handling.
   */
  _tokenize(text) {
    if (!text || typeof text !== 'string') return [];

    // Split camelCase: "getDatabaseConnection" -> "get Database Connection"
    const splitCamel = text.replace(/([a-z])([A-Z])/g, '$1 $2');

    // Split snake_case and kebab-case while keeping original terms
    const rawTokens = splitCamel
      .toLowerCase()
      .replace(/[^\w\s\-\.\:\/]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);

    const tokens = [];
    for (const tok of rawTokens) {
      tokens.push(tok);
      if (tok.includes('_')) {
        const parts = tok.split('_').filter(p => p.length > 1);
        tokens.push(...parts);
      }
      if (tok.includes('-')) {
        const parts = tok.split('-').filter(p => p.length > 1);
        tokens.push(...parts);
      }
    }

    return tokens;
  }

  /**
   * Persists inverted index and chunks to disk in data/rag/bm25/
   */
  async persist() {
    if (!this.isDirty) return;

    try {
      await fsp.mkdir(this.storageDir, { recursive: true });

      const nsGroups = {};
      for (const [chunkId, chunk] of this.chunks.entries()) {
        const ns = chunk.namespace || 'GLOBAL';
        if (!nsGroups[ns]) nsGroups[ns] = [];
        nsGroups[ns].push(chunk);
      }

      for (const [ns, chunks] of Object.entries(nsGroups)) {
        const targetPath = path.join(this.storageDir, `bm25_${ns}.json`);
        const tempPath = path.join(this.storageDir, `bm25_${ns}.tmp`);

        const payload = JSON.stringify({
          namespace: ns,
          version: '1.0.0',
          updatedAt: new Date().toISOString(),
          totalChunks: chunks.length,
          chunks
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
      totalTerms: this.invertedIndex.size,
      totalTokens: this.totalTokens,
      avgDocLength: Math.round(this.avgDocLength),
      namespaces: nsCounts
    };
  }
}

export const bm25Engine = new BM25Engine();
