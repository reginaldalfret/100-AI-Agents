import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultPythonComputeClient } from '../../platform/compute/python-client.js';

test('Python Compute: Deterministic API-653 Calculations', async (t) => {
  await t.test('calculates metal loss, corrosion rate, and remaining life with verification badge', async () => {
    const res = await defaultPythonComputeClient.callCompute('/calculate', {
      nominal_mm: 12.5,
      measured_mm: 10.2,
      years: 5.0
    });
    assert.equal(res.metal_loss_mm, 2.3);
    assert.equal(res.loss_percentage, 18.4);
    assert.equal(res.corrosion_rate_mm_per_year, 0.46);
    assert.equal(res.is_verified, true);
    assert.equal(res.calculation_badge, 'Calculation Verified');
  });
});
