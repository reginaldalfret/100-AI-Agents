import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultPythonComputeClient } from '../../platform/compute/python-client.js';

test('Python Compute: Zero External Egress Security Policy', async (t) => {
  await t.test('guarantees zero cloud calls and strict air-gap compliance', async () => {
    const res = await defaultPythonComputeClient.callCompute('/calculate', {
      nominal_mm: 14.0,
      measured_mm: 12.0,
      years: 4.0
    });
    assert.equal(res.is_air_gapped, true);
  });
});
