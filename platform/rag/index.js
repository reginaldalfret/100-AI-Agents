/**
 * Sovereign AI Workbench — Enterprise Local RAG & Document Intelligence Subsystem
 * 100% On-Premise, Air-Gapped, Zero External Cloud Dependencies.
 */

import { documentIngestion, DocumentIngestion } from './document-ingestion.js';
import { chunker, Chunker } from './chunker.js';
import { embeddingEngine, EmbeddingEngine } from './embedding-engine.js';
import { vectorIndex, VectorIndex } from './vector-index.js';
import { bm25Index, BM25Index } from './bm25.js';
import { hybridRetriever, HybridRetriever } from './hybrid-retriever.js';
import { reranker, Reranker } from './reranker.js';
import { evidencePacker, EvidencePacker } from './evidence-packer.js';
import { citationGenerator, CitationGenerator } from './citation-generator.js';
import { ragReferenceResolver, RAGReferenceResolver } from './reference-resolver.js';
import { ragSecurityGuard, RAGSecurityGuard } from './security.js';

import { codebaseIndexer, CodebaseIndexer } from './codebase-indexer.js';

export * from './document-ingestion.js';
export * from './chunker.js';
export * from './embedding-engine.js';
export * from './vector-index.js';
export * from './bm25.js';
export * from './hybrid-retriever.js';
export * from './reranker.js';
export * from './evidence-packer.js';
export * from './citation-generator.js';
export * from './reference-resolver.js';
export * from './security.js';
export * from './codebase-indexer.js';

/**
 * End-to-End High-Level Pipeline: Ingests document buffer or file, chunks it,
 * computes dense vectors, and indexes it into both Vector and BM25 indexes.
 * @param {Buffer|string} input - Buffer, text content, or file path.
 * @param {string} filename - Filename with extension.
 * @param {Object} [options] - Ingestion & indexing options.
 * @returns {Promise<Object>} { document, chunks, totalIndexed: number }
 */
export async function ingestDocument(input, filename, options = {}) {
  let doc;
  if (options.isFile) {
    doc = await documentIngestion.ingestFile(input, options);
  } else {
    doc = await documentIngestion.ingestBuffer(input, filename, options.mimeType, options);
  }

  const chunks = chunker.chunkDocument(doc, options);
  await hybridRetriever.addChunks(chunks);

  return {
    document: doc,
    chunks,
    totalIndexed: chunks.length
  };
}

/**
 * End-to-End High-Level Pipeline: Query RAG with reference resolution,
 * hybrid retrieval (BM25 + Dense Vector RRF), reranking, precise citations,
 * and structured <source_evidence> evidence pack construction.
 * @param {string} query 
 * @param {Object} [options] - { context, topK, namespace, documentId, maxTokens, rerank }
 * @returns {Promise<Object>} Complete RAG Result
 */
export async function queryRAG(query, options = {}) {
  // 1. Resolve coreferences & anaphora if context provided
  let effectiveQuery = query;
  let resolutionResult = null;
  if (options.context) {
    resolutionResult = ragReferenceResolver.resolveQuery(query, options.context);
    if (resolutionResult.resolved) {
      effectiveQuery = resolutionResult.resolvedQuery;
    }
  }

  // 2. Hybrid Retrieval (BM25 + Dense Vector RRF)
  const candidateLimit = (options.topK || 5) * 3;
  const retrievedChunks = hybridRetriever.search(effectiveQuery, {
    ...options,
    topK: candidateLimit
  });

  // 3. Reranking (optional, enabled by default)
  const shouldRerank = options.rerank !== false;
  const topK = options.topK || 5;
  const rankedChunks = shouldRerank 
    ? reranker.rerank(effectiveQuery, retrievedChunks, { topK })
    : retrievedChunks.slice(0, topK);

  // 4. Precise Citation Generation
  const citations = citationGenerator.generateCitations(rankedChunks);
  const markdownReferences = citationGenerator.formatMarkdownReferences(citations);

  // 5. Evidence Pack Wrapping (<source_evidence> Envelope)
  const evidencePack = evidencePacker.buildEvidencePack(rankedChunks, {
    maxTokens: options.maxTokens,
    maxChars: options.maxChars,
    sanitize: options.sanitize !== false
  });

  return {
    originalQuery: query,
    effectiveQuery,
    referenceResolution: resolutionResult,
    totalMatches: rankedChunks.length,
    chunks: rankedChunks,
    citations,
    markdownReferences,
    evidencePack: evidencePack.evidencePack,
    tokenEstimate: evidencePack.tokenEstimate,
    isAirGapped: true,
    externalCalls: 0
  };
}

/**
 * End-to-End High-Level Pipeline: Removes document from all indexes.
 * @param {string} documentId 
 * @returns {Promise<number>}
 */
export async function deleteDocument(documentId) {
  return await hybridRetriever.removeDocument(documentId);
}
