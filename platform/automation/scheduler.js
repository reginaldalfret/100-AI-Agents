/**
 * Sovereign AI Workbench — Local Scheduled Investigation Service
 * Runs recurring maintenance, audit, and anomaly-detection investigations completely on-premise.
 */

import { investigationEngine } from "../investigation/investigation-engine.js";

export class LocalScheduler {
  constructor() {
    this.scheduledJobs = new Map(); // job_id -> job_definition
  }

  registerJob(job) {
    if (!job || !job.id) return null;
    const item = {
      id: job.id,
      name: job.name || job.id,
      schedule: job.schedule || "EVERY_MONDAY_0800",
      objective: job.objective,
      enabled: job.enabled !== undefined ? job.enabled : true,
      last_run_at: null,
      last_run_status: null
    };

    this.scheduledJobs.set(item.id, item);
    return item;
  }

  async triggerJob(jobId) {
    const job = this.scheduledJobs.get(jobId);
    if (!job) throw new Error(`Job not found: ${jobId}`);

    job.last_run_at = new Date().toISOString();
    try {
      const inv = await investigationEngine.startInvestigation(job.objective, { auto_approve: false });
      job.last_run_status = "SUCCESS";
      return { job_id: jobId, status: "TRIGGERED", investigation_id: inv.investigation_id };
    } catch (err) {
      job.last_run_status = "FAILED";
      return { job_id: jobId, status: "FAILED", error: err.message };
    }
  }

  listJobs() {
    return Array.from(this.scheduledJobs.values());
  }
}

export const localScheduler = new LocalScheduler();
