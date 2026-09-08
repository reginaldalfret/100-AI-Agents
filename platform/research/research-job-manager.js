/**
 * 301 SUPER AI — Research Job Manager
 * Controlled, authenticated bridge between Windows Production and Fedora AI Research Lab.
 * Enforces hardware safety gates (SAFE, TIGHT, UNSUPPORTED) before any workload executes.
 */

import { EventEmitter } from 'node:events';
import { exec, spawn } from 'node:child_process';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';

export const JobStatus = {
  QUEUED: 'QUEUED',
  PREPARING: 'PREPARING',
  RUNNING: 'RUNNING',
  EVALUATING: 'EVALUATING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
};

export const SafetyRating = {
  SAFE: 'SAFE',
  TIGHT: 'TIGHT',
  UNSUPPORTED: 'UNSUPPORTED'
};

export class ResearchJobManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.jobs = new Map();
    this.wslDistro = options.distro || 'Fedora';
    this.maxConcurrentJobs = options.maxConcurrentJobs || 1;
    this.activeJobCount = 0;
  }

  /**
   * Evaluates hardware and resource bounds for an AI workload.
   * RTX 2050 (4GB VRAM) and 8GB System RAM Constraints.
   */
  evaluateSafety(jobSpec) {
    const { modelSizeB = 1.0, precision = '4bit', datasetSize = 100, seqLen = 512 } = jobSpec;

    // Reject models >= 7B on 4GB VRAM
    if (modelSizeB > 3.5) {
      return {
        rating: SafetyRating.UNSUPPORTED,
        reason: `Model size ${modelSizeB}B exceeds safe VRAM envelope (4096 MiB) on NVIDIA RTX 2050.`,
        recommendedMaxB: 1.5
      };
    }

    // Tight memory bounds for 3B models or 16-bit precision
    if (modelSizeB > 2.0 || precision === '16bit' || seqLen > 2048) {
      return {
        rating: SafetyRating.TIGHT,
        reason: 'Resource usage is near capacity. Recommend 4-bit QLoRA and seq_len <= 1024.',
        estimatedVramMb: 3500
      };
    }

    return {
      rating: SafetyRating.SAFE,
      reason: 'Workload fully fits within RTX 2050 4GB VRAM and WSL resource boundaries.',
      estimatedVramMb: 1200
    };
  }

  /**
   * Registers a new research job.
   */
  createJob(jobType, payload = {}) {
    const jobId = `job_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const safety = this.evaluateSafety(payload);

    if (safety.rating === SafetyRating.UNSUPPORTED) {
      throw new Error(`Safety Gate Rejected Job: ${safety.reason}`);
    }

    const job = {
      id: jobId,
      type: jobType, // QLORA_FINETUNE, GGUF_QUANTIZE, INFERENCE_BENCHMARK, MODEL_EXPORT
      status: JobStatus.QUEUED,
      safety,
      payload,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      exitCode: null,
      output: '',
      error: null
    };

    this.jobs.set(jobId, job);
    this.emit('jobCreated', job);
    return job;
  }

  /**
   * Returns a job by ID.
   */
  getJob(jobId) {
    return this.jobs.get(jobId);
  }

  /**
   * Lists all research jobs.
   */
  listJobs() {
    return Array.from(this.jobs.values());
  }

  /**
   * Executes a job through the controlled Fedora WSL runner.
   */
  async executeJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    if (job.status !== JobStatus.QUEUED) {
      throw new Error(`Job ${jobId} is not in QUEUED state (current: ${job.status})`);
    }

    job.status = JobStatus.PREPARING;
    job.startedAt = new Date().toISOString();
    this.emit('jobStatusChanged', job);

    return new Promise((resolve, reject) => {
      let scriptPath = '';
      let args = [];

      switch (job.type) {
        case 'QLORA_FINETUNE':
          scriptPath = '/mnt/e/Smart Automation/100-AI-Agents/scripts/fedora/test-qlora.sh';
          break;
        case 'INFERENCE_BENCHMARK':
          scriptPath = '/mnt/e/Smart Automation/100-AI-Agents/scripts/fedora/benchmark-model.sh';
          break;
        case 'GGUF_QUANTIZE':
          scriptPath = '/mnt/e/Smart Automation/100-AI-Agents/scripts/fedora/quantize-model.sh';
          args = [job.payload.inputModel || '', job.payload.targetType || 'Q4_K_M'];
          break;
        case 'MODEL_EXPORT':
          scriptPath = '/mnt/e/Smart Automation/100-AI-Agents/scripts/fedora/export-model.sh';
          args = [job.payload.sourceFile || '', job.payload.category || 'research'];
          break;
        default:
          job.status = JobStatus.FAILED;
          job.error = `Unsupported job type: ${job.type}`;
          this.emit('jobFailed', job);
          return reject(new Error(job.error));
      }

      job.status = JobStatus.RUNNING;
      this.emit('jobStatusChanged', job);

      const wslArgs = ['-d', this.wslDistro, '-e', 'bash', scriptPath, ...args];
      const proc = spawn('wsl.exe', wslArgs);

      proc.stdout.on('data', (d) => {
        job.output += d.toString();
      });

      proc.stderr.on('data', (d) => {
        job.output += d.toString();
      });

      proc.on('close', (code) => {
        job.completedAt = new Date().toISOString();
        job.exitCode = code;

        if (code === 0) {
          job.status = JobStatus.COMPLETED;
          this.emit('jobCompleted', job);
          resolve(job);
        } else {
          job.status = JobStatus.FAILED;
          job.error = `Process exited with code ${code}`;
          this.emit('jobFailed', job);
          resolve(job);
        }
      });

      proc.on('error', (err) => {
        job.status = JobStatus.FAILED;
        job.error = err.message;
        job.completedAt = new Date().toISOString();
        this.emit('jobFailed', job);
        reject(err);
      });
    });
  }
}

export const researchJobManager = new ResearchJobManager();
