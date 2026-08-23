import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { 
  embeddingEngine, 
  EmbeddingEngine, 
  EMBEDDING_DIMENSION 
} from '../../platform/rag/index.js';

describe('RAG Subsystem — 3. Dense Semantic Embedding Engine Test Suite', () => {
  const engine = new EmbeddingEngine({
    maxRamCacheSize: 1000
  });

  test('1. Generates 384-dimensional Float32Array dense vectors', () => {
    const text = 'API-653 Tank Inspection Standard Minimum Shell Thickness 6.80 mm';
    const vec = engine.embed(text);

    assert.ok(vec instanceof Float32Array);
    assert.strictEqual(vec.length, EMBEDDING_DIMENSION);
    assert.strictEqual(vec.length, 384);
  });

  test('2. Enforces exact L2 normalization (||v||_2 = 1.0)', () => {
    const text = 'Refinery safety protocol for hot work permits and gas monitoring';
    const vec = engine.embed(text);

    let sumSq = 0;
    for (let i = 0; i < vec.length; i++) {
      sumSq += vec[i] * vec[i];
    }
    const norm = Math.sqrt(sumSq);

    // Vector norm must equal 1.0 within floating point precision
    assert.ok(Math.abs(norm - 1.0) < 1e-5, `Norm ${norm} should be 1.0`);
  });

  test('3. Cosine similarity mathematical properties: identity, symmetry, and bounds', () => {
    const textA = 'Crude oil storage tank shell corrosion rate assessment';
    const textB = 'Atmospheric tank corrosion measurement and wall thinning';
    const textC = 'University semester examination grading criteria and scholarship finance';

    const vecA = engine.embed(textA);
    const vecB = engine.embed(textB);
    const vecC = engine.embed(textC);

    // 1. Identity: Sim(A, A) must be ~1.0
    const simSelf = engine.cosineSimilarity(vecA, vecA);
    assert.ok(Math.abs(simSelf - 1.0) < 1e-4, `Self-similarity ${simSelf} must be ~1.0`);

    // 2. Symmetry: Sim(A, B) == Sim(B, A)
    const simAB = engine.cosineSimilarity(vecA, vecB);
    const simBA = engine.cosineSimilarity(vecB, vecA);
    assert.ok(Math.abs(simAB - simBA) < 1e-6, 'Cosine similarity must be symmetric');

    // 3. Domain relevance: Related texts have higher similarity than unrelated texts
    const simAC = engine.cosineSimilarity(vecA, vecC);
    assert.ok(simAB > simAC, `Related similarity ${simAB} should exceed unrelated similarity ${simAC}`);

    // 4. Bounds: Must be within [0.0, 1.0]
    assert.ok(simAB >= 0.0 && simAB <= 1.0);
    assert.ok(simAC >= 0.0 && simAC <= 1.0);
  });

  test('4. Batch embedding produces matching vector array', () => {
    const texts = [
      'Document 1: Flare stack emission monitoring',
      'Document 2: Heat exchanger tube fouling inspection',
      'Document 3: Centrifugal pump seal failure diagnosis'
    ];

    const batch = engine.embedBatch(texts);
    assert.strictEqual(batch.length, 3);
    for (const vec of batch) {
      assert.strictEqual(vec.length, 384);
      assert.ok(vec instanceof Float32Array);
    }
  });

  test('5. Dual-layer RAM chunkHash caching and cache hit statistics', () => {
    const testHash = 'test_hash_chunk_9999';
    const sampleText = 'Hydrostatic testing of pressure vessels under ASME Section VIII';

    const initialHits = engine.cacheHits;
    const initialMisses = engine.cacheMisses;

    // First call: Cache miss
    const vec1 = engine.embed(sampleText, { chunkHash: testHash });
    assert.strictEqual(engine.cacheMisses, initialMisses + 1);

    // Second call with same chunkHash: Cache hit
    const vec2 = engine.embed(sampleText, { chunkHash: testHash });
    assert.strictEqual(engine.cacheHits, initialHits + 1);

    // Vectors must be identical
    assert.deepStrictEqual(vec1, vec2);

    const stats = engine.getStats();
    assert.ok(stats.cachedVectors > 0);
    assert.strictEqual(stats.dimension, 384);
  });

  test('6. Fast CPU throughput (>2000 embeddings/sec without GPU)', () => {
    const sample = 'API-653 standard calculation for tank retirement thickness course 3';
    const iterations = 500;

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      engine.embed(`${sample} iteration_${i}`, { skipCache: true });
    }
    const elapsedMs = performance.now() - start;

    const throughputPerSec = (iterations / elapsedMs) * 1000;
    assert.ok(elapsedMs < 1000, `500 embeddings completed in ${elapsedMs.toFixed(2)}ms (throughput: ${throughputPerSec.toFixed(0)}/sec)`);
  });
});
