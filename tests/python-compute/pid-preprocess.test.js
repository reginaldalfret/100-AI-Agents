import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultPythonComputeClient } from '../../platform/compute/python-client.js';

test('Python Compute: P&ID Drawing Preprocessing & Tag Extraction', async (t) => {
  await t.test('identifies ISA-5.1 tags and pipe line connections', async () => {
    const res = await defaultPythonComputeClient.callCompute('/image/analyze', {
      image_path: 'tests/sih26117/fixtures/pid-crude-distillation-drawing.svg',
      task_type: 'pid'
    });
    assert.ok(res.tags_detected.includes('TK-101'));
    assert.ok(res.tags_detected.includes('P-101A'));
  });
});
