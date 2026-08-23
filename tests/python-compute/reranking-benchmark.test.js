import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultPythonComputeClient } from '../../platform/compute/python-client.js';

test('Python Compute: Reciprocal Rank Fusion Reranking', async (t) => {
  await t.test('ranks candidate documents using hybrid RRF scoring', async () => {
    const res = await defaultPythonComputeClient.callCompute('/rerank', {
      query: 'tank inspection thickness',
      documents: [
        { id: 'doc1', bm25_rank: 1, vector_rank: 5 },
        { id: 'doc2', bm25_rank: 2, vector_rank: 1 }
      ]
    });
    assert.ok(Array.isArray(res));
    assert.ok(res[0].rrf_score >= res[1].rrf_score);
  });
});
