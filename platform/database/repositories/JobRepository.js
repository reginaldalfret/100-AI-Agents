/**
 * Sovereign AI Workbench - Job Repository
 * Manages persistent job tracking states, audit payloads, and completed results in PostgreSQL.
 * Note: Transient queue orchestration belongs to Redis/BullMQ; PostgreSQL provides durable audit history.
 */

import { randomUUID } from 'node:crypto';
import { query } from '../client.js';

// In-memory fallback for air-gapped / offline resiliency
const fallbackJobs = new Map();

export class JobRepository {
  /**
   * Create a new persistent job record.
   * @param {string} type - Job category / task type
   * @param {Object} [payload={}] - Initial input parameters or arguments
   * @returns {Promise<Object>}
   */
  static async createJob(type, payload = {}) {
    if (!type) {
      throw new Error('[JobRepository] job_type is required');
    }

    const payloadJson = JSON.stringify(payload || {});
    const sql = `
      INSERT INTO jobs (job_type, status, payload, created_at, updated_at)
      VALUES ($1, 'QUEUED', $2::jsonb, NOW(), NOW())
      RETURNING *;
    `;

    try {
      const res = await query(sql, [type, payloadJson]);
      return res.rows[0];
    } catch (err) {
      console.warn('[JobRepository Warning] Database offline, storing job in-memory:', err.message);
      const offlineJob = {
        id: randomUUID(),
        job_type: type,
        status: 'QUEUED',
        payload: payload || {},
        result: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      fallbackJobs.set(offlineJob.id, offlineJob);
      return offlineJob;
    }
  }

  /**
   * Update the execution status and output result of a job.
   * @param {string} jobId
   * @param {string} status - e.g. 'RUNNING', 'COMPLETED', 'FAILED'
   * @param {Object|null} [result=null] - Output artifact or error summary
   * @returns {Promise<Object|null>}
   */
  static async updateStatus(jobId, status, result = null) {
    if (!jobId) {
      throw new Error('[JobRepository] jobId is required');
    }
    if (!status) {
      throw new Error('[JobRepository] status is required');
    }

    const resultJson = result !== null && result !== undefined ? JSON.stringify(result) : null;
    const sql = `
      UPDATE jobs
      SET status = $2,
          result = $3::jsonb,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;

    try {
      const res = await query(sql, [jobId, status, resultJson]);
      return res.rows.length > 0 ? res.rows[0] : null;
    } catch (err) {
      console.warn(`[JobRepository Warning] Database offline, updating job ${jobId} in-memory:`, err.message);
      const job = fallbackJobs.get(jobId);
      if (!job) return null;
      job.status = status;
      job.result = result;
      job.updated_at = new Date().toISOString();
      return { ...job };
    }
  }

  /**
   * Retrieve a job by its unique identifier.
   * @param {string} jobId
   * @returns {Promise<Object|null>}
   */
  static async getJob(jobId) {
    if (!jobId) return null;

    try {
      const res = await query('SELECT * FROM jobs WHERE id = $1 LIMIT 1', [jobId]);
      return res.rows.length > 0 ? res.rows[0] : null;
    } catch (err) {
      console.warn(`[JobRepository Warning] Database offline, retrieving job ${jobId} from in-memory:`, err.message);
      const job = fallbackJobs.get(jobId);
      return job ? { ...job } : null;
    }
  }
}

export default JobRepository;
