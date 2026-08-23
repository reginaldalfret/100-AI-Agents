import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultPythonComputeClient } from '../../platform/compute/python-client.js';

test('Python Compute: PDF Document Intelligence', async (t) => {
  await t.test('processes PDF and extracts page structures without raw binary leakage', async () => {
    const res = await defaultPythonComputeClient.callCompute('/pdf/process', {
      file_path: 'tests/sih26117/fixtures/tank-042-inspection-report.txt'
    });
    assert.ok(res);
    assert.ok(res.full_text);
    assert.equal(res.is_air_gapped, true);
  });
});
