/**
 * Sovereign AI Workbench — Hybrid Lexical + Dense Vector Retrieval Engine
 * Fuses Dense Vector Semantic Search with Okapi BM25 Lexical Retrieval
 * using Reciprocal Rank Fusion (RRF) and Weighted Score Fusion.
 *
 * 100% On-Premise, Air-Gapped, Zero External Cloud Dependencies.
 */

import { vectorIndex, VectorIndex } from './vector-index.js';
import { bm25Index, BM25Index } from './bm25.js';

export class HybridRetriever {
  constructor(options = {}) {
    this.vectorIndex = options.vectorIndex || vectorIndex;
    this.bm25Index = options.bm25Index || bm25Index;
    this.defaultRrfK = options.rrfK || 60;
    this.defaultVectorWeight = options.vectorWeight ?? 0.5;
    this.defaultBm25Weight = options.bm25Weight ?? 0.5;
  }

  /**
   * Indexes an array of chunks into both Vector Index and BM25 Index.
   * @param {Array<Object>} chunks 
   * @param {Array<Float32Array>} [vectors] 
   * @returns {Promise<number>}
   */
  async addChunks(chunks, vectors = null) {
    if (!Array.isArray(chunks) || chunks.length === 0) return 0;
    
    await this.vectorIndex.addChunks(chunks, vectors);
    this.bm25Index.addChunks(chunks);
    return chunks.length;
  }

  /**
   * Performs hybrid retrieval using Reciprocal Rank Fusion (RRF).
   * @param {string} query 
   * @param {Object} options - { topK, vectorWeight, bm25Weight, rrfK, namespace, documentId, fileType, filter, fusionMode }
   * @returns {Array<Object>}
   */
  search(query, options = {}) {
    if (!query || typeof query !== 'string') return [];

    const topK = options.topK || 5;
    const vectorWeight = options.vectorWeight ?? this.defaultVectorWeight;
    const bm25Weight = options.bm25Weight ?? this.defaultBm25Weight;
    const rrfK = options.rrfK || this.defaultRrfK;
    const candidateLimit = Math.max(topK * 4, 30);

    // 1. Execute Dense Vector Search
    const vectorResults = this.vectorIndex.search(query, {
      ...options,
      topK: candidateLimit
    });

    // 2. Execute BM25 Lexical Search
    const bm25Results = this.bm25Index.search(query, {
      ...options,
      topK: candidateLimit
    });

    // 3. Reciprocal Rank Fusion (RRF)
    const fusedMap = new Map();

    // Process Vector Ranks
    vectorResults.forEach((item, rank) => {
      const chunkId = item.chunkId;
      const rrfComponent = vectorWeight * (1.0 / (rrfK + rank + 1));
      
      fusedMap.set(chunkId, {
        chunk: item,
        vectorRank: rank + 1,
        vectorScore: item.vectorScore || item.score,
        bm25Rank: null,
        bm25Score: 0.0,
        rrfScore: rrfComponent,
        sources: ['vector']
      });
    });

    // Process BM25 Ranks
    bm25Results.forEach((item, rank) => {
      const chunkId = item.chunkId;
      const rrfComponent = bm25Weight * (1.0 / (rrfK + rank + 1));

      if (fusedMap.has(chunkId)) {
        const existing = fusedMap.get(chunkId);
        existing.bm25Rank = rank + 1;
        existing.bm25Score = item.bm25Score || item.score;
        existing.rrfScore += rrfComponent;
        existing.sources.push('bm25');
      } else {
        fusedMap.set(chunkId, {
          chunk: item,
          vectorRank: null,
          vectorScore: 0.0,
          bm25Rank: rank + 1,
          bm25Score: item.bm25Score || item.score,
          rrfScore: rrfComponent,
          sources: ['bm25']
        });
      }
    });

    // 4. Transform and sort
    const finalResults = Array.from(fusedMap.values()).map(entry => {
      const baseChunk = entry.chunk;
      return {
        ...baseChunk,
        vectorScore: entry.vectorScore,
        bm25Score: entry.bm25Score,
        vectorRank: entry.vectorRank,
        bm25Rank: entry.bm25Rank,
        rrfScore: entry.rrfScore,
        score: entry.rrfScore, // primary ranking score
        retrievalSources: entry.sources
      };
    });

    finalResults.sort((a, b) => b.score - a.score);
    return finalResults.slice(0, topK);
  }

  /**
   * Removes a document from both indexes.
   * @param {string} documentId 
   * @returns {Promise<number>}
   */
  async removeDocument(documentId) {
    const vCount = await this.vectorIndex.removeDocument(documentId);
    const bCount = this.bm25Index.removeDocument(documentId);
    return Math.max(vCount, bCount);
  }

  /**
   * Clears both indexes.
   * @param {string} [namespace] 
   */
  async clear(namespace = null) {
    await this.vectorIndex.clear(namespace);
    this.bm25Index.clear(namespace);
  }
}

export const hybridRetriever = new HybridRetriever();
