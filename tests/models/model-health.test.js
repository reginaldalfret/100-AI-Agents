import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getHardwareProfile } from '../../platform/models/hardware-profiler.js';
import { modelLifecycle, ModelLifecycleState as LifecycleState } from '../../platform/models/model-lifecycle.js';
import { modelStreamer, ModelLifecycleState as StreamerState } from '../../platform/models/model-streamer.js';
import { LOCAL_MODELS } from '../../platform/models/model-registry.js';

describe('Model Health, Hardware Profiling & Lifecycle Management Test Suite', () => {
  describe('Hardware Profiler & Edge Constraints', () => {
    it('returns a valid hardware profile for sovereign edge execution', () => {
      const profile = getHardwareProfile();
      assert.ok(profile, 'Hardware profile must be returned');
      assert.equal(profile.gpu_model, 'NVIDIA GeForce RTX 2050');
      assert.equal(profile.vram_total_mb, 4096);
      assert.equal(profile.max_concurrent_models, 1, 'Concurrency must be strictly bounded to 1 on RTX 2050');
      assert.equal(profile.max_concurrent_tasks, 4);
      assert.equal(profile.recommended_quantization, 'Q4_K_M');
      assert.equal(profile.is_air_gapped_compatible, true);
      assert.ok(profile.system_ram_total_gb > 0);
      assert.ok(profile.cpu_cores > 0);
    });
  });

  describe('Model Lifecycle Manager (VRAM Allocation & History)', () => {
    it('manages model slot acquisition, transition, and release', async () => {
      // 1. Acquire slot for Nemotron
      const slot1 = await modelLifecycle.acquireModelSlot('nemotron-3-nano');
      assert.equal(slot1.acquired, true);
      assert.equal(slot1.model_id, 'nemotron-3-nano');
      assert.equal(modelLifecycle.getModelState('nemotron-3-nano'), LifecycleState.ACTIVE);

      // 2. Sequential switch to Gemma 4 E2B
      const slot2 = await modelLifecycle.acquireModelSlot('gemma4-e2b');
      assert.equal(slot2.acquired, true);
      assert.equal(slot2.model_id, 'gemma4-e2b');
      assert.equal(modelLifecycle.getModelState('gemma4-e2b'), LifecycleState.ACTIVE);
      assert.equal(modelLifecycle.getModelState('nemotron-3-nano'), LifecycleState.IDLE);

      // 3. Release slot and verify execution trace
      const trace = modelLifecycle.releaseModelSlot('gemma4-e2b', { duration_ms: 45, status: 'success' });
      assert.ok(trace.trace_id.startsWith('tr_'));
      assert.equal(trace.model_id, 'gemma4-e2b');
      assert.equal(trace.status, 'success');
      assert.equal(trace.external_calls, 0);
      assert.equal(trace.is_air_gapped, true);
      assert.equal(modelLifecycle.getModelState('gemma4-e2b'), LifecycleState.IDLE);

      // 4. Verify history log contains the trace
      const history = modelLifecycle.getExecutionHistory();
      assert.ok(history.length > 0);
      assert.equal(history[history.length - 1].trace_id, trace.trace_id);
    });
  });

  describe('Model Streamer Lifecycle & Execution Lock', () => {
    it('defines all valid streamer lifecycle states', () => {
      assert.equal(StreamerState.UNLOADED, 'unloaded');
      assert.equal(StreamerState.PREPARING, 'preparing_model');
      assert.equal(StreamerState.ACTIVE, 'model_ready');
      assert.equal(StreamerState.STREAMING, 'streaming_tokens');
      assert.equal(StreamerState.IDLE, 'idle');
      assert.equal(StreamerState.ERROR, 'error');
    });

    it('acquires and releases execution lock with single-GPU concurrency protection', async () => {
      const lock1 = await modelStreamer.acquireExecutionLock('nemotron-3-nano');
      assert.equal(lock1.acquired, true);
      assert.equal(modelStreamer.activeModel, 'nemotron-3-nano');

      // Attempt second acquire while locked (should be queued)
      let queuedResolved = false;
      const lockPromise = modelStreamer.acquireExecutionLock('qwen2.5-coder:1.5b').then(res => {
        queuedResolved = true;
        return res;
      });

      assert.equal(queuedResolved, false, 'Second lock acquire must wait in queue');

      // Release first lock, should grant to second
      modelStreamer.releaseExecutionLock();
      const lock2 = await lockPromise;
      assert.equal(lock2.acquired, true);
      assert.equal(lock2.isSwitch, true);
      assert.equal(modelStreamer.activeModel, 'qwen2.5-coder:1.5b');

      // Release second lock
      modelStreamer.releaseExecutionLock();
      assert.equal(modelStreamer.isInferencing, false);
    });

    it('handles stream cancellation safely', () => {
      const cancelled = modelStreamer.cancelStream('non_existent_stream_id');
      assert.equal(cancelled, false);
    });
  });

  describe('Model Registry Endpoint Health Checks', () => {
    it('ensures all registered model endpoints target localhost without remote leakage', () => {
      for (const model of LOCAL_MODELS) {
        const url = new URL(model.endpoint);
        assert.ok(
          url.hostname === '127.0.0.1' || url.hostname === 'localhost',
          `Model ${model.model_id} endpoint ${model.endpoint} must target local host`
        );
      }
    });
  });
});
