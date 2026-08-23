import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultPythonComputeClient } from '../../platform/compute/python-client.js';

test('Python Compute: Spreadsheet & XLSX Intelligence', async (t) => {
  await t.test('parses sheets, headers, and numeric rows', async () => {
    const res = await defaultPythonComputeClient.callCompute('/xlsx/process', {
      file_path: 'tests/sih26117/fixtures/corrosion-thickness-data.csv'
    });
    assert.ok(res);
    assert.ok(res.sheet_names.length >= 1);
    assert.equal(res.is_air_gapped, true);
  });
});
