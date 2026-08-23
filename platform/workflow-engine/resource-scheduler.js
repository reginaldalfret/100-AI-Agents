/**
 * Sovereign AI Workbench — Resource Scheduler
 * 
 * Enforces GPU Safety on RTX 2050 (4GB VRAM):
 * - Serializes GPU-heavy model inference (max 1 concurrent GPU inference slot)
 * - Allows concurrent CPU/RAG/Document operations (max 8 concurrent CPU slots)
 * - Priority task queue with telemetry tracking and cancellation support
 */

import EventEmitter from 'events';

export class ResourceScheduler extends EventEmitter {
  constructor(options = {}) {
    super();
    this.maxConcurrentGPU = options.maxConcurrentGPU || 1;
    this.maxConcurrentCPU = options.maxConcurrentCPU || 8;
    this.activeGPUJobs = 0;
    this.activeCPUJobs = 0;
    this.gpuQueue = [];
    this.cpuQueue = [];
    this.history = [];
    this.totalExecuted = 0;
    this.totalErrors = 0;
  }

  /**
   * Schedule a task for execution with resource guarantees.
   * @param {Object} spec
   * @param {string} spec.id Task/Execution ID
   * @param {string} [spec.type='GPU'] 'GPU' | 'CPU' | 'HYBRID'
   * @param {number} [spec.priority=1] 1 = Normal, 2 = High, 3 = Critical
   * @param {Function} spec.execute Async function to run
   * @param {AbortSignal} [spec.signal] Optional cancellation signal
   */
  async schedule(spec) {
    const isGPU = spec.type === 'GPU' || spec.type === 'HYBRID' || !spec.type;
    const taskRecord = {
      id: spec.id || `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: isGPU ? 'GPU' : 'CPU',
      priority: spec.priority || 1,
      queuedAt: Date.now(),
      startedAt: null,
      completedAt: null,
      durationMs: 0,
      status: 'QUEUED',
      execute: spec.execute,
      signal: spec.signal
    };

    if (taskRecord.signal?.aborted) {
      taskRecord.status = 'CANCELLED';
      throw new Error('Task was cancelled before execution started.');
    }

    return new Promise((resolve, reject) => {
      taskRecord.resolve = resolve;
      taskRecord.reject = reject;

      if (isGPU) {
        this.gpuQueue.push(taskRecord);
        this.gpuQueue.sort((a, b) => b.priority - a.priority || a.queuedAt - b.queuedAt);
        this.emit('task:queued', { taskId: taskRecord.id, queue: 'GPU', queueLength: this.gpuQueue.length });
        this._pumpGPUQueue();
      } else {
        this.cpuQueue.push(taskRecord);
        this.cpuQueue.sort((a, b) => b.priority - a.priority || a.queuedAt - b.queuedAt);
        this.emit('task:queued', { taskId: taskRecord.id, queue: 'CPU', queueLength: this.cpuQueue.length });
        this._pumpCPUQueue();
      }
    });
  }

  _pumpGPUQueue() {
    if (this.activeGPUJobs >= this.maxConcurrentGPU || this.gpuQueue.length === 0) {
      return;
    }

    const task = this.gpuQueue.shift();
    if (!task) return;

    if (task.signal?.aborted) {
      task.status = 'CANCELLED';
      task.reject(new Error('Task was cancelled.'));
      this._pumpGPUQueue();
      return;
    }

    this.activeGPUJobs++;
    task.startedAt = Date.now();
    task.status = 'RUNNING';
    this.emit('task:started', { taskId: task.id, type: 'GPU', activeGPU: this.activeGPUJobs });

    Promise.resolve()
      .then(() => task.execute())
      .then((result) => {
        task.completedAt = Date.now();
        task.durationMs = task.completedAt - task.startedAt;
        task.status = 'COMPLETED';
        this.totalExecuted++;
        this.history.push({ id: task.id, type: 'GPU', durationMs: task.durationMs, status: 'COMPLETED' });
        this.emit('task:completed', { taskId: task.id, durationMs: task.durationMs });
        task.resolve(result);
      })
      .catch((err) => {
        task.completedAt = Date.now();
        task.durationMs = task.completedAt - task.startedAt;
        task.status = 'FAILED';
        this.totalErrors++;
        this.history.push({ id: task.id, type: 'GPU', durationMs: task.durationMs, status: 'FAILED', error: err.message });
        this.emit('task:failed', { taskId: task.id, error: err.message });
        task.reject(err);
      })
      .finally(() => {
        this.activeGPUJobs--;
        if (this.history.length > 200) this.history.shift();
        this._pumpGPUQueue();
      });
  }

  _pumpCPUQueue() {
    if (this.activeCPUJobs >= this.maxConcurrentCPU || this.cpuQueue.length === 0) {
      return;
    }

    const task = this.cpuQueue.shift();
    if (!task) return;

    if (task.signal?.aborted) {
      task.status = 'CANCELLED';
      task.reject(new Error('Task was cancelled.'));
      this._pumpCPUQueue();
      return;
    }

    this.activeCPUJobs++;
    task.startedAt = Date.now();
    task.status = 'RUNNING';
    this.emit('task:started', { taskId: task.id, type: 'CPU', activeCPU: this.activeCPUJobs });

    Promise.resolve()
      .then(() => task.execute())
      .then((result) => {
        task.completedAt = Date.now();
        task.durationMs = task.completedAt - task.startedAt;
        task.status = 'COMPLETED';
        this.totalExecuted++;
        this.history.push({ id: task.id, type: 'CPU', durationMs: task.durationMs, status: 'COMPLETED' });
        task.resolve(result);
      })
      .catch((err) => {
        task.completedAt = Date.now();
        task.durationMs = task.completedAt - task.startedAt;
        task.status = 'FAILED';
        this.totalErrors++;
        this.history.push({ id: task.id, type: 'CPU', durationMs: task.durationMs, status: 'FAILED', error: err.message });
        task.reject(err);
      })
      .finally(() => {
        this.activeCPUJobs--;
        if (this.history.length > 200) this.history.shift();
        this._pumpCPUQueue();
      });
  }

  getTelemetry() {
    return {
      hardwareProfile: 'NVIDIA RTX 2050 (4GB VRAM)',
      maxConcurrentGPU: this.maxConcurrentGPU,
      maxConcurrentCPU: this.maxConcurrentCPU,
      activeGPUJobs: this.activeGPUJobs,
      activeCPUJobs: this.activeCPUJobs,
      gpuQueueLength: this.gpuQueue.length,
      cpuQueueLength: this.cpuQueue.length,
      totalExecuted: this.totalExecuted,
      totalErrors: this.totalErrors,
      vramSafetyLock: true
    };
  }

  cancelTask(taskId) {
    const gpuIdx = this.gpuQueue.findIndex(t => t.id === taskId);
    if (gpuIdx !== -1) {
      const [task] = this.gpuQueue.splice(gpuIdx, 1);
      task.status = 'CANCELLED';
      task.reject(new Error(`Task ${taskId} was cancelled.`));
      return true;
    }
    const cpuIdx = this.cpuQueue.findIndex(t => t.id === taskId);
    if (cpuIdx !== -1) {
      const [task] = this.cpuQueue.splice(cpuIdx, 1);
      task.status = 'CANCELLED';
      task.reject(new Error(`Task ${taskId} was cancelled.`));
      return true;
    }
    return false;
  }
}

export const globalScheduler = new ResourceScheduler();
