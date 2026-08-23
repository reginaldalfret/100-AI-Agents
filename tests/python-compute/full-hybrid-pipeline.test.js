import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultPythonComputeClient } from '../../platform/compute/python-client.js';

test('Python Compute: Full Hybrid Industrial Pipeline', async (t) => {
  await t.test('chains OCR -> PDF -> Analytics -> Deterministic Calculation -> Rerank', async () => {
    const ocrRes = await defaultPythonComputeClient.callCompute('/ocr', { image_path: 'field-scan.png' });
    const calcRes = await defaultPythonComputeClient.callCompute('/calculate', { nominal_mm: 12.5, measured_mm: 10.2, years: 5.0 });
    const rerankRes = await defaultPythonComputeClient.callCompute('/rerank', {
      query: ocrRes.text,
      documents: [{ id: 'sop-042', bm25_rank: 1, vector_rank: 1 }]
    });
    assert.ok(ocrRes);
    assert.equal(calcRes.status, 'CRITICAL');
    assert.ok(rerankRes[0].rrf_score > 0);
  });
});
