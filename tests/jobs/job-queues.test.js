import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  GpuLock,
  gpuLock,
  jobRepository,
  queueManager,
  QUEUE_NAMES
} from '../../platform/jobs/index.js';

describe('Redis & BullMQ Job Subsystem with GPU Lock', () => {
  describe('GpuLock Concurrency Enforcer', () => {
    let lock;

    beforeEach(() => {
      lock = new GpuLock();
    });

    it('starts unlocked with queue length 0', () => {
      assert.equal(lock.isLocked(), false);
      assert.equal(lock.getQueueLength(), 0);
      assert.equal(lock.getCurrentHolder(), null);
    });

    it('acquires lock immediately when free', async () => {
      const acquired = await lock.acquire('job-1', 'test');
      assert.equal(acquired, true);
      assert.equal(lock.isLocked(), true);
      assert.equal(lock.getCurrentHolder().jobId, 'job-1');
    });

    it('enforces strict sequential queue when GPU is held', async () => {
      await lock.acquire('job-1', 'test');

      let job2Acquired = false;
      const job2Promise = lock.acquire('job-2', 'test').then(() => {
        job2Acquired = true;
      });

      assert.equal(lock.getQueueLength(), 1);
      assert.equal(job2Acquired, false);

      // Release job-1, which should automatically grant job-2
      lock.release('job-1');
      await job2Promise;

      assert.equal(job2Acquired, true);
      assert.equal(lock.getCurrentHolder().jobId, 'job-2');
      assert.equal(lock.getQueueLength(), 0);

      lock.release('job-2');
      assert.equal(lock.isLocked(), false);
    });
  });

  describe('JobRepository & Lifecycle', () => {
    it('creates job record with initial queued state', () => {
      const job = jobRepository.createJob(QUEUE_NAMES.MODEL_GENERATION, {
        prompt: 'test',
        model_id: 'nemotron-3-nano'
      });

      assert.ok(job.job_id);
      assert.equal(job.status, 'queued');
      assert.equal(job.progress, 0);
      assert.ok(job.created_at);
    });

    it('retrieves and updates job state', () => {
      const job = jobRepository.createJob('test-queue', { foo: 'bar' });
      const retrieved = jobRepository.getJob(job.job_id);
      assert.equal(retrieved.job_id, job.job_id);

      jobRepository.updateJob(job.job_id, {
        status: 'running',
        progress: 50
      });

      const updated = jobRepository.getJob(job.job_id);
      assert.equal(updated.status, 'running');
      assert.equal(updated.progress, 50);
    });

    it('cancels pending job', () => {
      const job = jobRepository.createJob('test-queue', { cancelMe: true });
      const success = jobRepository.cancelJob(job.job_id);
      assert.equal(success, true);

      const updated = jobRepository.getJob(job.job_id);
      assert.equal(updated.status, 'cancelled');
    });
  });
});
