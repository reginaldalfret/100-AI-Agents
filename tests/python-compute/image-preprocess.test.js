import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultPythonComputeClient } from '../../platform/compute/python-client.js';

test('Python Compute: Image Preprocessing', async (t) => {
  await t.test('applies deskew, denoise, and contrast operations', async () => {
    const res = await defaultPythonComputeClient.callCompute('/image/preprocess', {
      image_path: 'drawing.png',
      operations: ['deskew', 'denoise', 'contrast']
    });
    assert.ok(res);
    assert.equal(res.format, 'PNG');
  });
});
