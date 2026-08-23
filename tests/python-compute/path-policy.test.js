import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultPythonComputeClient } from '../../platform/compute/python-client.js';

test('Python Compute: Path Resolution and Sandboxing Policy', async (t) => {
  await t.test('safely resolves files inside workspace root', async () => {
    const res = await defaultPythonComputeClient.callCompute('/pdf/process', {
      file_path: 'E:/Smart Automation/100-AI-Agents/README.md'
    });
    assert.ok(res);
  });
});
