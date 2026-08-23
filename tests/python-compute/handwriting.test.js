import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultPythonComputeClient } from '../../platform/compute/python-client.js';

test('Python Compute: Handwritten Field Note Recognition', async (t) => {
  await t.test('processes handwritten notes with explicit confidence', async () => {
    const res = await defaultPythonComputeClient.callCompute('/ocr', {
      image_path: 'tests/fixtures/handwritten-note.png',
      mode: 'handwriting'
    });
    assert.ok(res.text.length > 20);
    assert.ok(res.confidence > 0.8);
  });
});
