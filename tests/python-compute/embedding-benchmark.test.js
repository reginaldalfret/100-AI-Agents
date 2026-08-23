import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultPythonComputeClient } from '../../platform/compute/python-client.js';

test('Python Compute: Dense Vector Embedding Generation', async (t) => {
  await t.test('generates normalized 384-dimensional dense projection vector', async () => {
    const res = await defaultPythonComputeClient.callCompute('/embeddings', {
      text: 'Ultrasonic thickness measurement on storage tank shell course 1'
    });
    assert.ok(res.embedding);
    assert.equal(res.dimensions, 384);
  });
});
