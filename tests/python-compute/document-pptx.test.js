import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultPythonComputeClient } from '../../platform/compute/python-client.js';

test('Python Compute: PowerPoint Extraction', async (t) => {
  await t.test('extracts slide titles and text contents', async () => {
    const res = await defaultPythonComputeClient.callCompute('/pptx/process', {
      file_path: 'presentation.pptx'
    });
    assert.ok(res);
    assert.ok(res.slides.length >= 1);
  });
});
