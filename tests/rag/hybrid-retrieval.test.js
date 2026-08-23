import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { 
  HybridRetriever, 
  VectorIndex, 
  BM25Index, 
  IngestionNamespace 
} from '../../platform/rag/index.js';

describe('RAG Subsystem — 6. Hybrid Lexical + Dense Vector Retrieval Test Suite', () => {
  const vIndex = new VectorIndex({ storageDir: 'data/rag/test_hybrid_v' });
  const bIndex = new BM25Index({ k1: 1.2, b: 0.75 });
  const hybrid = new HybridRetriever({
    vectorIndex: vIndex,
    bm25Index: bIndex,
    rrfK: 60,
    vectorWeight: 0.5,
    bm25Weight: 0.5
  });

  const dataset = [
    {
      chunkId: 'chunk_retire_limit',
      documentId: 'doc_api_653',
      filename: 'API-653-Inspection.pdf',
      namespace: IngestionNamespace.GLOBAL,
      text: 'API-653 retirement thickness limit for Tank Shell Course 3 is 6.80 mm. If thickness drops below this value, repair or de-rating is mandatory.',
      enrichedText: '[Document: API-653-Inspection.pdf | Section: Shell] API-653 retirement thickness limit Course 3 is 6.80 mm.',
      pageNumber: 14
    },
    {
      chunkId: 'chunk_corrosion_theory',
      documentId: 'doc_corrosion_guide',
      filename: 'corrosion_mechanisms.pdf',
      namespace: IngestionNamespace.GLOBAL,
      text: 'Under-deposit corrosion and pitting can cause localized wall loss in crude storage tanks without general thinning.',
      enrichedText: '[Document: corrosion_mechanisms.pdf | Section: Pitting] Under-deposit corrosion and localized wall loss in crude tanks.',
      pageNumber: 5
    },
    {
      chunkId: 'chunk_pump_standard',
      documentId: 'doc_api_610',
      filename: 'API-610-Pumps.pdf',
      namespace: IngestionNamespace.GLOBAL,
      text: 'Centrifugal pumps for petroleum refinery services must comply with vibration severity limit of 4.5 mm/s RMS.',
      enrichedText: '[Document: API-610-Pumps.pdf | Section: Vibration] Centrifugal pumps vibration limit 4.5 mm/s RMS.',
      pageNumber: 22
    }
  ];

  test('1. Indexes chunks into both dense vector and BM25 sparse indexes', async () => {
    await hybrid.clear();
    const count = await hybrid.addChunks(dataset);
    assert.strictEqual(count, 3);
  });

  test('2. Hybrid search achieves superior rank fusion using RRF', () => {
    // Query contains both conceptual semantics ("tank wall loss") and exact keywords ("6.80 mm API-653")
    const query = 'tank wall loss retirement threshold 6.80 mm API-653 Course 3';
    const results = hybrid.search(query, { topK: 2 });

    assert.ok(results.length > 0);
    const topResult = results[0];

    assert.strictEqual(topResult.chunkId, 'chunk_retire_limit');
    assert.ok(topResult.rrfScore > 0);
    assert.ok(topResult.retrievalSources.includes('vector') || topResult.retrievalSources.includes('bm25'));
    assert.ok(topResult.text.includes('6.80 mm'));
  });

  test('3. Respects custom vector and BM25 weighting in rank fusion', () => {
    // Heavily vector-biased query
    const resultsVectorBiased = hybrid.search('localized wall thinning and pitting degradation', {
      vectorWeight: 0.9,
      bm25Weight: 0.1,
      topK: 2
    });

    assert.ok(resultsVectorBiased.length > 0);
    assert.strictEqual(resultsVectorBiased[0].chunkId, 'chunk_corrosion_theory');

    // Heavily BM25-biased exact symbol query
    const resultsBm25Biased = hybrid.search('4.5 mm/s RMS API-610', {
      vectorWeight: 0.1,
      bm25Weight: 0.9,
      topK: 2
    });

    assert.ok(resultsBm25Biased.length > 0);
    assert.strictEqual(resultsBm25Biased[0].chunkId, 'chunk_pump_standard');
  });

  test('4. Enforces top-K limits and metadata filtering across both engines', () => {
    const top1 = hybrid.search('petroleum standard limits', { topK: 1 });
    assert.strictEqual(top1.length, 1);

    const docFiltered = hybrid.search('retirement thickness', {
      documentId: 'doc_api_653',
      topK: 5
    });
    assert.strictEqual(docFiltered.length, 1);
    assert.strictEqual(docFiltered[0].documentId, 'doc_api_653');
  });

  test('5. Synchronized document removal from both underlying indexes', async () => {
    const removedCount = await hybrid.removeDocument('doc_api_653');
    assert.ok(removedCount >= 1);

    const afterRemove = hybrid.search('6.80 mm API-653 Tank Shell Course 3');
    assert.ok(!afterRemove.some(r => r.documentId === 'doc_api_653'));
  });
});
