import { Queue } from 'bullmq';
import { safeRedis } from './redis-client.js';
import { gpuLock } from './gpu-lock.js';

export const QUEUE_NAMES = {
  MODEL_GENERATION: 'model-generation',
  MODEL_ARENA: 'model-arena',
  FINE_TUNING: 'fine-tuning',
  DATASET_PROCESSING: 'dataset-processing'
};

/**
 * In-memory job repository for tracking job lifecycle and state
 */
class JobRepository {
  constructor() {
    this.jobs = new Map();
  }

  createJob(type, payload, options = {}) {
    const jobId = options.jobId || crypto.randomUUID();
    const jobRecord = {
      job_id: jobId,
      type,
      status: 'queued', // queued | running | completed | failed | cancelled
      created_at: new Date().toISOString(),
      started_at: null,
      completed_at: null,
      progress: 0,
      payload,
      result: null,
      error: null
    };

    this.jobs.set(jobId, jobRecord);
    this.cleanupOldJobs();
    return jobRecord;
  }

  getJob(jobId) {
    return this.jobs.get(jobId) || null;
  }

  updateJob(jobId, updates = {}) {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    Object.assign(job, updates);
    return job;
  }

  cancelJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    if (job.status === 'completed' || job.status === 'failed') {
      return false;
    }

    job.status = 'cancelled';
    job.completed_at = new Date().toISOString();
    gpuLock.release(jobId);
    return true;
  }

  cleanupOldJobs(maxRetain = 500) {
    if (this.jobs.size > maxRetain) {
      const entries = Array.from(this.jobs.entries());
      const toRemove = entries.slice(0, entries.length - maxRetain);
      for (const [id] of toRemove) {
        this.jobs.delete(id);
      }
    }
  }

  listJobs(filterType) {
    const all = Array.from(this.jobs.values());
    if (filterType) return all.filter(j => j.type === filterType);
    return all;
  }
}

export const jobRepository = new JobRepository();

/**
 * BullMQ Queue Manager with Redis connection or safe fallback
 */
class QueueManager {
  constructor() {
    this.queues = new Map();
  }

  getQueue(queueName) {
    if (!this.queues.has(queueName)) {
      const client = safeRedis.getClient();
      if (client && safeRedis.isAvailable) {
        try {
          const queue = new Queue(queueName, {
            connection: client,
            defaultJobOptions: {
              removeOnComplete: { count: 100 },
              removeOnFail: { count: 50 },
              attempts: 2,
              backoff: { type: 'exponential', delay: 1000 }
            }
          });
          this.queues.set(queueName, queue);
        } catch {
          // Fall back to memory tracking
        }
      }
    }
    return this.queues.get(queueName) || null;
  }

  /**
   * Enqueue a new background task
   */
  async addJob(queueName, payload, options = {}) {
    const jobRecord = jobRepository.createJob(queueName, payload, options);
    const queue = this.getQueue(queueName);

    if (queue) {
      try {
        await queue.add(queueName, payload, {
          jobId: jobRecord.job_id,
          ...options
        });
      } catch (err) {
        // Fallback gracefully to repository tracking
      }
    }

    return jobRecord;
  }
}

export const queueManager = new QueueManager();
