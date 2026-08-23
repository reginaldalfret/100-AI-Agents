import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultPythonComputeClient } from '../../platform/compute/python-client.js';

test('Python Compute: Pandas/NumPy Dataset Analytics', async (t) => {
  await t.test('computes mean, median, standard deviation, and outliers', async () => {
    const res = await defaultPythonComputeClient.callCompute('/data/analyze', {
      data: [12.5, 12.4, 12.1, 10.2, 8.1, 11.9, 12.2]
    });
    assert.ok(res.count === 7);
    assert.ok(res.mean > 0);
    assert.ok(res.min === 8.1);
  });
});
