/**
 * Sovereign AI Workbench — Deterministic BM25 Lexical Retrieval Engine
 * High-performance Okapi BM25 implementation supporting exact symbol, number,
 * technical identifier matching, and namespace-scoped lexical search.
 *
 * 100% On-Premise, Air-Gapped, Zero External Cloud Dependencies.
 */

export class BM25Index {
  constructor(options = {}) {
    this.k1 = options.k1 ?? 1.2;
    this.b = options.b ?? 0.75;
    
    // Chunk Map: chunkId -> { chunk, terms: Map<term, count>, length: number }
    this.chunks = new Map();
    // Inverted Index / Document Frequencies: term -> Set<chunkId>
    this.termPostings = new Map();
    // Namespace Index: namespace -> Set<chunkId>
    this.namespaces = new Map();
    // Document Index: documentId -> Set<chunkId>
    this.documentIndex = new Map();
    
    this.totalDocLength = 0;
  }

  get totalDocs() {
    return this.chunks.size;
  }

  get avgDocLength() {
    return this.totalDocs > 0 ? this.totalDocLength / this.totalDocs : 0;
  }

  /**
   * Tokenizes text preserving alphanumeric terms, technical symbols (e.g. API-653, OISD-STD-129),
   * numbers with decimals (e.g. 6.80), and code identifiers.
   * @param {string} text 
   * @returns {Array<string>}
   */
  tokenize(text) {
    if (!text || typeof text !== 'string') return [];
    
    // Extract technical identifiers, hyphenated codes, numbers, and words
    const lower = text.toLowerCase();
    const rawTokens = lower.match(/[a-z0-9]+(?:[\-_.:/][a-z0-9]+)*/g) || [];
    
    const tokens = [];
    for (const t of rawTokens) {
      // Add compound token (e.g., "api-653", "6.80")
      tokens.push(t);
      // If token contains hyphens/underscores/dots, also add sub-parts
      if (/[\-_.:/]/.test(t)) {
        const subparts = t.split(/[\-_.:/]+/).filter(p => p.length > 0);
        for (const sp of subparts) {
          if (sp.length > 1) {
            tokens.push(sp);
          }
        }
      }
    }
    return tokens;
  }

  /**
   * Adds an array of structured chunks to the BM25 index.
   * @param {Array<Object>} chunks 
   * @returns {number} Count of indexed chunks.
   */
  addChunks(chunks) {
    if (!Array.isArray(chunks) || chunks.length === 0) return 0;

    for (const chk of chunks) {
      const chunkId = chk.chunkId;
      if (!chunkId) continue;

      // If chunk already exists, remove it first
      if (this.chunks.has(chunkId)) {
        this._removeChunkInternal(chunkId);
      }

      const text = `${chk.enrichedText || ''} ${chk.text || ''}`.trim();
      const tokens = this.tokenize(text);
      const termCounts = new Map();

      for (const token of tokens) {
        termCounts.set(token, (termCounts.get(token) || 0) + 1);
      }

      const docLen = tokens.length;
      this.chunks.set(chunkId, {
        chunk: chk,
        terms: termCounts,
        length: docLen
      });

      this.totalDocLength += docLen;

      // Update Inverted Index postings
      for (const term of termCounts.keys()) {
        if (!this.termPostings.has(term)) {
          this.termPostings.set(term, new Set());
        }
        this.termPostings.get(term).add(chunkId);
      }

      // Namespace tracking
      const ns = chk.namespace || 'GLOBAL';
      if (!this.namespaces.has(ns)) {
        this.namespaces.set(ns, new Set());
      }
      this.namespaces.get(ns).add(chunkId);

      // Document tracking
      const docId = chk.documentId || 'doc_unknown';
      if (!this.documentIndex.has(docId)) {
        this.documentIndex.set(docId, new Set());
      }
      this.documentIndex.get(docId).add(chunkId);
    }

    return chunks.length;
  }

  /**
   * Computes Inverse Document Frequency (IDF) with BM25 smoothing (always positive).
   * @param {string} term 
   * @returns {number}
   */
  idf(term) {
    const n = this.termPostings.has(term) ? this.termPostings.get(term).size : 0;
    const N = this.totalDocs;
    if (N === 0) return 0;
    
    // Standard Robertson-Spärck Jones BM25 IDF with smoothing
    const rawIdf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
    return Math.max(0.01, rawIdf);
  }

  /**
   * Searches the BM25 index with lexical query.
   * @param {string} query 
   * @param {Object} options - { topK, minScore, namespace, documentId, fileType, filter }
   * @returns {Array<Object>} Ranked results with bm25Score.
   */
  search(query, options = {}) {
    if (!query || typeof query !== 'string' || this.totalDocs === 0) {
      return [];
    }

    const topK = options.topK || 5;
    const minScore = options.minScore || 0.0;
    const targetNs = options.namespace || null;
    const targetDocId = options.documentId || null;
    const targetFileType = options.fileType || null;
    const filterFn = typeof options.filter === 'function' ? options.filter : null;

    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0) return [];

    const avgLen = this.avgDocLength;
    const k1 = this.k1;
    const b = this.b;

    // Collect candidate chunks containing at least one query term
    const candidateChunkIds = new Set();
    for (const qTerm of queryTokens) {
      const postings = this.termPostings.get(qTerm);
      if (postings) {
        for (const cid of postings) {
          candidateChunkIds.add(cid);
        }
      }
    }

    if (candidateChunkIds.size === 0) return [];

    const scoredResults = [];
    const queryLower = query.toLowerCase();

    for (const chunkId of candidateChunkIds) {
      const entry = this.chunks.get(chunkId);
      if (!entry) continue;

      const { chunk, terms, length: docLen } = entry;

      // Metadata Filtering
      if (targetNs && chunk.namespace !== targetNs) continue;
      if (targetDocId && chunk.documentId !== targetDocId) continue;
      if (targetFileType && chunk.fileType !== targetFileType) continue;
      if (filterFn && !filterFn(chunk)) continue;

      // Compute Okapi BM25 Score
      let score = 0;
      for (const qTerm of queryTokens) {
        const tf = terms.get(qTerm) || 0;
        if (tf > 0) {
          const termIdf = this.idf(qTerm);
          const numerator = tf * (k1 + 1);
          const denominator = tf + k1 * (1 - b + b * (avgLen > 0 ? docLen / avgLen : 1));
          score += termIdf * (numerator / denominator);
        }
      }

      // Exact phrase / exact symbol bonus
      const chunkTextLower = (chunk.enrichedText || chunk.text || '').toLowerCase();
      if (chunkTextLower.includes(queryLower) && queryLower.length > 4) {
        score += 1.5;
      }

      if (score >= minScore) {
        scoredResults.push({
          ...chunk,
          bm25Score: score,
          score
        });
      }
    }

    // Rank descending by BM25 score
    scoredResults.sort((a, b) => b.bm25Score - a.bm25Score);
    return scoredResults.slice(0, topK);
  }

  /**
   * Removes all chunks belonging to a document.
   * @param {string} documentId 
   * @returns {number} Number of removed chunks.
   */
  removeDocument(documentId) {
    if (!this.documentIndex.has(documentId)) return 0;

    const chunkIds = Array.from(this.documentIndex.get(documentId));
    let removedCount = 0;

    for (const cid of chunkIds) {
      this._removeChunkInternal(cid);
      removedCount++;
    }

    this.documentIndex.delete(documentId);
    return removedCount;
  }

  _removeChunkInternal(chunkId) {
    const entry = this.chunks.get(chunkId);
    if (!entry) return;

    // Update totalDocLength
    this.totalDocLength -= entry.length;

    // Remove from inverted index
    for (const term of entry.terms.keys()) {
      const postings = this.termPostings.get(term);
      if (postings) {
        postings.delete(chunkId);
        if (postings.size === 0) {
          this.termPostings.delete(term);
        }
      }
    }

    // Remove from namespace
    const ns = entry.chunk.namespace || 'GLOBAL';
    if (this.namespaces.has(ns)) {
      this.namespaces.get(ns).delete(chunkId);
      if (this.namespaces.get(ns).size === 0) {
        this.namespaces.delete(ns);
      }
    }

    // Remove from chunk map
    this.chunks.delete(chunkId);
  }

  /**
   * Clears the index entirely or for a specific namespace.
   * @param {string} [namespace] 
   */
  clear(namespace = null) {
    if (namespace) {
      if (this.namespaces.has(namespace)) {
        const chunkIds = Array.from(this.namespaces.get(namespace));
        for (const cid of chunkIds) {
          const entry = this.chunks.get(cid);
          if (entry) {
            const docId = entry.chunk.documentId;
            if (this.documentIndex.has(docId)) {
              this.documentIndex.get(docId).delete(cid);
            }
            this._removeChunkInternal(cid);
          }
        }
        this.namespaces.delete(namespace);
      }
    } else {
      this.chunks.clear();
      this.termPostings.clear();
      this.namespaces.clear();
      this.documentIndex.clear();
      this.totalDocLength = 0;
    }
  }

  getStats() {
    return {
      totalDocs: this.totalDocs,
      vocabularySize: this.termPostings.size,
      avgDocLength: parseFloat(this.avgDocLength.toFixed(2)),
      totalDocLength: this.totalDocLength,
      namespaces: Array.from(this.namespaces.keys())
    };
  }
}

export const bm25Index = new BM25Index();
