import test from 'node:test';
import assert from 'node:assert/strict';
import { isCpuModel } from '../../platform/models/model-registry.js';
import { modelStreamer } from '../../platform/models/model-streamer.js';

test('Runtime CPU-Only Model Execution & Mutex Bypass', async (t) => {
  await t.test('CPU models bypass GPU mutex lock and return isCpu: true', async () => {
    const lock1 = await modelStreamer.acquireExecutionLock('LiquidAI/lfm2.5-350m');
    assert.strictEqual(lock1.acquired, true);
    assert.strictEqual(lock1.isCpu, true);
    modelStreamer.releaseExecutionLock(lock1);

    const lock2 = await modelStreamer.acquireExecutionLock('mollysama/rwkv-7-g1d:0.4b');
    assert.strictEqual(lock2.acquired, true);
    assert.strictEqual(lock2.isCpu, true);
    modelStreamer.releaseExecutionLock(lock2);
  });

  await t.test('isCpuModel correctly classifies Liquid AI LFM2.5 350M and RWKV-7 0.4B', () => {
    assert.strictEqual(isCpuModel('LiquidAI/lfm2.5-350m'), true);
    assert.strictEqual(isCpuModel('lfm2.5-350m'), true);
    assert.strictEqual(isCpuModel('mollysama/rwkv-7-g1d:0.4b'), true);
    assert.strictEqual(isCpuModel('rwkv7-0.4b'), true);
    assert.strictEqual(isCpuModel('rwkv'), true);
  });
});
