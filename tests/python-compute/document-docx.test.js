import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultPythonComputeClient } from '../../platform/compute/python-client.js';

test('Python Compute: DOCX Processing', async (t) => {
  await t.test('extracts paragraphs, headings, and tables from DOCX', async () => {
    const res = await defaultPythonComputeClient.callCompute('/docx/process', {
      file_path: 'docs/test_doc.docx'
    });
    assert.ok(res);
    assert.ok(res.full_text);
  });
});
