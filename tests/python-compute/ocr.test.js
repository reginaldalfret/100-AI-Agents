import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultPythonComputeClient } from '../../platform/compute/python-client.js';

test('Python Compute: OCR Engine & Confidence Scoring', async (t) => {
  await t.test('extracts text with calibrated word-level confidence', async () => {
    const res = await defaultPythonComputeClient.callCompute('/ocr', {
      image_path: 'tests/fixtures/inspection-report-scan.png',
      mode: 'standard'
    });
    assert.ok(res.text.includes('TK-042'));
    assert.ok(res.confidence >= 0.85);
    assert.equal(res.is_air_gapped, true);
  });
});
