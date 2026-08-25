import test from 'node:test';
import assert from 'node:assert/strict';
import { isCpuModel } from '../../platform/models/model-registry.js';
import { modelStreamer } from '../../platform/models/model-streamer.js';

test('Runtime CPU-Only Model Execution & Mutex Bypass', async (t) => {
  await t.test('CPU models bypass GPU mutex lock and return isCpu: true', async () => {
    const lock = await modelStreamer.acquireExecutionLock('LiquidAI/lfm2.5-1.2b-instruct:latest');
    assert.strictEqual(lock.acquired, true);
    assert.strictEqual(lock.isCpu, true);
    modelStreamer.releaseExecutionLock(lock);
  });

  await t.test('isCpuModel correctly classifies Liquid AI LFM2.5', () => {
    assert.strictEqual(isCpuModel('LiquidAI/lfm2.5-1.2b-instruct:latest'), true);
    assert.strictEqual(isCpuModel('lfm2.5-1.2b-instruct'), true);
    assert.strictEqual(isCpuModel('lfm'), true);
  });
});
