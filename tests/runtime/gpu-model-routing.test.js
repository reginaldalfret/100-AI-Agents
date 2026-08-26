import test from 'node:test';
import assert from 'node:assert/strict';
import { getModelById, getGpuModels } from '../../platform/models/model-registry.js';
import { modelLifecycle } from '../../platform/models/model-lifecycle.js';

test('GPU Model Lifecycle & Concurrency Mutex', async (t) => {
  await t.test('Falcon3 1B acquires GPU slot successfully', async () => {
    const falcon = getModelById('falcon3-1b-instruct');
    assert.ok(falcon);
    assert.strictEqual(falcon.execution_target, 'GPU');

    const slot = await modelLifecycle.acquireModelSlot('falcon3-1b-instruct');
    assert.ok(slot, 'Slot must be acquired');
  });

  await t.test('All GPU models are listed under getGpuModels()', () => {
    const gpuModels = getGpuModels();
    const falcon = gpuModels.find(m => m.model_id === 'falcon3-1b-instruct');
    assert.ok(falcon, 'Falcon3 1B must be present in getGpuModels()');
    assert.strictEqual(falcon.primaryTag, 'SCIENCE');
  });
});
