import test from 'node:test';
import assert from 'node:assert/strict';
import { PythonComputeClient } from '../../platform/compute/python-client.js';

test('Python Compute: Graceful Node.js Fallback Engine', async (t) => {
  await t.test('executes deterministic Node.js fallback when service is offline', async () => {
    const offlineClient = new PythonComputeClient({ baseUrl: 'http://127.0.0.1:9999' });
    const res = await offlineClient.callCompute('/calculate', {
      nominal_mm: 12.5,
      measured_mm: 10.2,
      years: 5.0
    });
    assert.equal(res.engine, 'node_fallback');
    assert.equal(res.metal_loss_mm, 2.3);
    assert.equal(res.is_verified, true);
  });
});
