import { test } from 'node:test';
import assert from 'node:assert';
import { ResourceScheduler } from '../../platform/workflow-engine/resource-scheduler.js';

test('14. Resource Scheduler: Enforces RTX 2050 (4GB VRAM) single concurrent GPU inference limit', async () => {
  const scheduler = new ResourceScheduler({ maxConcurrentGPU: 1, maxConcurrentCPU: 4 });
  
  let currentActiveGPU = 0;
  let maxObservedGPU = 0;
  
  const runGpuJob = (id, delayMs) => {
    return scheduler.schedule({
      id,
      type: 'GPU',
      execute: async () => {
        currentActiveGPU++;
        maxObservedGPU = Math.max(maxObservedGPU, currentActiveGPU);
        await new Promise(r => setTimeout(r, delayMs));
        currentActiveGPU--;
        return { success: true, id };
      }
    });
  };
  
  const p1 = runGpuJob('job-1', 40);
  const p2 = runGpuJob('job-2', 40);
  const p3 = runGpuJob('job-3', 40);
  
  await Promise.all([p1, p2, p3]);
  
  assert.strictEqual(maxObservedGPU, 1, 'GPU inference must never exceed maxConcurrentGPU = 1 on RTX 2050');
  
  const telemetry = scheduler.getTelemetry();
  assert.strictEqual(telemetry.totalExecuted, 3);
  assert.strictEqual(telemetry.maxConcurrentGPU, 1);
  assert.strictEqual(telemetry.vramSafetyLock, true);
});