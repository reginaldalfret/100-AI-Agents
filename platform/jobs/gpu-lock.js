/**
 * Application-Wide GPU Concurrency Lock
 * Hardware Boundary: NVIDIA GeForce RTX 2050 (4GB VRAM)
 * Enforces strict 1-at-a-time concurrency limit across all GPU workloads.
 */

export class GpuLock {
  constructor() {
    this.currentHolder = null;
    this.currentContext = null;
    this.acquiredAt = null;
    this.waitQueue = [];
  }

  /**
   * Whether the GPU is currently executing a workload.
   */
  isLocked() {
    return this.currentHolder !== null;
  }

  /**
   * Current job holding the GPU lock.
   */
  getCurrentHolder() {
    return this.currentHolder
      ? {
          jobId: this.currentHolder,
          context: this.currentContext,
          acquiredAt: this.acquiredAt,
          durationMs: Date.now() - this.acquiredAt
        }
      : null;
  }

  /**
   * Queue length waiting for GPU.
   */
  getQueueLength() {
    return this.waitQueue.length;
  }

  /**
   * Acquire the GPU lock. Resolves when the GPU is available for this job.
   * @param {string} jobId
   * @param {string} [context='gpu-task']
   * @param {number} [timeoutMs=120000]
   * @returns {Promise<boolean>}
   */
  async acquire(jobId, context = 'gpu-task', timeoutMs = 120000) {
    if (!this.currentHolder) {
      this.currentHolder = jobId;
      this.currentContext = context;
      this.acquiredAt = Date.now();
      return true;
    }

    return new Promise((resolve, reject) => {
      let timeoutId = null;

      const entry = {
        jobId,
        context,
        resolve: () => {
          if (timeoutId) clearTimeout(timeoutId);
          this.currentHolder = jobId;
          this.currentContext = context;
          this.acquiredAt = Date.now();
          resolve(true);
        },
        reject: (err) => {
          if (timeoutId) clearTimeout(timeoutId);
          reject(err);
        }
      };

      if (timeoutMs > 0) {
        timeoutId = setTimeout(() => {
          const idx = this.waitQueue.indexOf(entry);
          if (idx !== -1) {
            this.waitQueue.splice(idx, 1);
            reject(new Error(`GPU lock acquire timeout after ${timeoutMs}ms for job ${jobId}`));
          }
        }, timeoutMs);
      }

      this.waitQueue.push(entry);
    });
  }

  /**
   * Release the GPU lock and hand off to the next waiting job in the queue.
   * @param {string} jobId
   * @returns {boolean}
   */
  release(jobId) {
    if (this.currentHolder !== jobId && this.currentHolder !== null) {
      // Trying to release a lock held by another job
      return false;
    }

    this.currentHolder = null;
    this.currentContext = null;
    this.acquiredAt = null;

    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift();
      next.resolve();
    }

    return true;
  }

  /**
   * Force release the lock (for emergency cancel or error recovery).
   */
  forceRelease() {
    this.currentHolder = null;
    this.currentContext = null;
    this.acquiredAt = null;
    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift();
      next.resolve();
    }
  }
}

export const gpuLock = new GpuLock();
