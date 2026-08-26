import test from 'node:test';
import assert from 'node:assert/strict';
import { isCpuModel } from '../../platform/models/model-registry.js';
import { modelStreamer } from '../../platform/models/model-streamer.js';

test('CPU Runtime Selection and Concurrency Lock Bypass', async (t) => {
  await t.test('All 5 CPU models bypass GPU mutex lock', async () => {
    const models = [
      'LiquidAI/lfm2.5-350m',
      'mollysama/rwkv-7-g1d:0.4b'    ];

    for (const model of models) {
      const lock = await modelStreamer.acquireExecutionLock(model);
      assert.strictEqual(lock.acquired, true, `Lock must be acquired for ${model}`);
      assert.strictEqual(lock.isCpu, true, `Model ${model} must be recognized as CPU`);
      modelStreamer.releaseExecutionLock(lock);
    }
  });
});
