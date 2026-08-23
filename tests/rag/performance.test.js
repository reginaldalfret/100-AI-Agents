import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { 
  VectorIndex, 
  BM25Index, 
  HybridRetriever, 
  EmbeddingEngine 
} from '../../platform/rag/index.js';

describe('RAG Subsystem — 13. High-Performance CPU Throughput & Sub-10ms Retrieval Test Suite', () => {
  const embedding = new EmbeddingEngine();
  const vIndex = new VectorIndex({ storageDir: 'data/rag/test_perf_v' });
  const bIndex = new BM25Index();
  const hybrid = new HybridRetriever({ vectorIndex: vIndex, bm25Index: bIndex });

  // Generate 500 realistic domain chunks for stress testing
  const corpusSize = 500;
  const perfChunks = [];

  for (let i = 0; i < corpusSize; i++) {
    const equipId = `TK-${100 + (i % 50)}`;
    const course = (i % 5) + 1;
    const thickness = (5.5 + (i % 30) * 0.1).toFixed(2);
    const pressure = (10 + (i % 40) * 0.5).toFixed(1);

    perfChunks.push({
      chunkId: `perf_chk_${String(i).padStart(4, '0')}`,
      documentId: `doc_perf_${i % 25}`,
      filename: `inspection_record_${i % 25}.pdf`,
      heading: `Equipment ${equipId} Course ${course} Thickness`,
      text: `Inspection record for storage tank ${equipId} Course ${course}: ultrasonic measured thickness is ${thickness} mm. Design operating pressure is ${pressure} PSI. Comply with API-653 standards.`,
      enrichedText: `[Document: inspection_record_${i % 25}.pdf | Section: ${equipId}] Tank ${equipId} Course ${course} thickness ${thickness} mm pressure ${pressure} PSI API-653.`,
      pageNumber: (i % 20) + 1
    });
  }

  test('1. Batch indexes 500 chunks with high CPU throughput', async () => {
    await hybrid.clear();
    const start = performance.now();
    const count = await hybrid.addChunks(perfChunks);
    const elapsedMs = performance.now() - start;

    assert.strictEqual(count, corpusSize);
    assert.ok(elapsedMs < 2000, `Indexing 500 chunks took ${elapsedMs.toFixed(2)}ms (< 2000ms target)`);
  });

  test('2. Lexical BM25 search executes in sub-10ms for 500 chunks', () => {
    const query = 'TK-120 Course 3 thickness 6.80 mm API-653';
    
    // Warmup
    bIndex.search(query, { topK: 5 });

    const iterations = 50;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      const res = bIndex.search(query, { topK: 5 });
      assert.ok(res.length > 0);
    }
    const elapsedMs = performance.now() - start;
    const avgLatencyMs = elapsedMs / iterations;

    assert.ok(avgLatencyMs < 10.0, `BM25 search latency ${avgLatencyMs.toFixed(3)}ms should be < 10ms`);
  });

  test('3. Dense Vector cosine search executes in sub-10ms for 500 384-dim vectors', () => {
    const query = 'atmospheric storage tank ultrasonic shell thickness measurement';
    
    // Warmup
    vIndex.search(query, { topK: 5 });

    const iterations = 50;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      const res = vIndex.search(query, { topK: 5 });
      assert.ok(res.length > 0);
    }
    const elapsedMs = performance.now() - start;
    const avgLatencyMs = elapsedMs / iterations;

    assert.ok(avgLatencyMs < 10.0, `Vector search latency ${avgLatencyMs.toFixed(3)}ms should be < 10ms`);
  });

  test('4. Hybrid fused retrieval executes in sub-15ms', () => {
    const query = 'TK-125 Course 2 minimum retirement thickness API-653';

    // Warmup
    hybrid.search(query, { topK: 5 });

    const iterations = 50;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      const res = hybrid.search(query, { topK: 5 });
      assert.ok(res.length > 0);
    }
    const elapsedMs = performance.now() - start;
    const avgLatencyMs = elapsedMs / iterations;

    assert.ok(avgLatencyMs < 15.0, `Hybrid retrieval latency ${avgLatencyMs.toFixed(3)}ms should be < 15ms`);
  });

  test('5. Zero GPU requirement and lightweight memory footprint', () => {
    const vStats = vIndex.getStats();
    const bStats = bIndex.getStats();

    assert.strictEqual(vStats.totalChunks, corpusSize);
    assert.strictEqual(bStats.totalDocs, corpusSize);

    // Approximate memory for 500 chunks of 384 Float32 + overhead is well under 10MB
    assert.ok(vStats.approximateMemoryBytes < 10 * 1024 * 1024);
  });
});
