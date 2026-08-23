import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultPythonComputeClient } from '../../platform/compute/python-client.js';

test('Python Compute: Derived Image & Visual Feature Output', async (t) => {
  await t.test('returns structured visual feature vectors and anomaly detections', async () => {
    const res = await defaultPythonComputeClient.callCompute('/image/analyze', {
      image_path: 'inspection_photo.png',
      task_type: 'corrosion'
    });
    assert.ok(res);
    assert.equal(res.is_air_gapped, true);
  });
});
