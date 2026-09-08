import { gpuLock } from './gpu-lock.js';
import { jobRepository } from './job-queues.js';
import { runtimeRouter } from '../models/runtimes/index.js';

export class JobWorker {
  constructor() {
    this.isRunning = true;
  }

  /**
   * Execute a GPU generation task with hardware safety lock
   */
  async processModelTask(jobId, modelId, prompt, options = {}) {
    const job = jobRepository.getJob(jobId);
    if (!job || job.status === 'cancelled') return null;

    jobRepository.updateJob(jobId, {
      status: 'running',
      started_at: new Date().toISOString(),
      progress: 10
    });

    // 1. Enforce strict 1-at-a-time GPU Lock
    await gpuLock.acquire(jobId, `task:${modelId}`);

    try {
      jobRepository.updateJob(jobId, { progress: 40 });
      const result = await runtimeRouter.generate(modelId, prompt, options);

      jobRepository.updateJob(jobId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        progress: 100,
        result
      });

      return result;
    } catch (err) {
      jobRepository.updateJob(jobId, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        error: err.message
      });
      throw err;
    } finally {
      // 2. Always release lock for next waiting job
      gpuLock.release(jobId);
    }
  }

  /**
   * Execute Model Arena 8-model sequential comparison
   */
  async processArenaComparison(jobId, prompt, modelIds = []) {
    const job = jobRepository.getJob(jobId);
    if (!job || job.status === 'cancelled') return null;

    jobRepository.updateJob(jobId, {
      status: 'running',
      started_at: new Date().toISOString(),
      progress: 5
    });

    const results = {};
    const totalModels = modelIds.length || 8;

    for (let i = 0; i < modelIds.length; i++) {
      const currentModel = modelIds[i];

      // Check if job was cancelled mid-run
      const currentJobState = jobRepository.getJob(jobId);
      if (currentJobState?.status === 'cancelled') {
        break;
      }

      const subTaskId = `${jobId}_sub_${currentModel}`;
      await gpuLock.acquire(subTaskId, `arena:${currentModel}`);

      try {
        const res = await runtimeRouter.generate(currentModel, prompt);
        results[currentModel] = res;
      } catch (err) {
        results[currentModel] = { error: err.message, status: 'error' };
      } finally {
        gpuLock.release(subTaskId);
      }

      const progress = Math.round(((i + 1) / totalModels) * 90) + 5;
      jobRepository.updateJob(jobId, { progress, result: results });
    }

    jobRepository.updateJob(jobId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      progress: 100,
      result: results
    });

    return results;
  }
}

export const jobWorker = new JobWorker();
