/**
 * Sovereign AI Workbench - PostgreSQL Database Health Checker
 * Verifies active database connection and measures round-trip latency.
 */

import { query } from './client.js';

/**
 * Check PostgreSQL database health status and response latency.
 * Does not crash if the database is offline; gracefully returns UNAVAILABLE status.
 * 
 * @returns {Promise<{ status: 'READY' | 'UNAVAILABLE', latencyMs: number, error: string | null }>}
 */
export async function checkDbHealth() {
  const start = Date.now();
  try {
    const res = await query('SELECT 1 AS health');
    const latencyMs = Date.now() - start;
    if (res && res.rows && res.rows.length > 0) {
      return {
        status: 'READY',
        latencyMs,
        error: null
      };
    }
    return {
      status: 'UNAVAILABLE',
      latencyMs,
      error: 'Unexpected database response'
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    return {
      status: 'UNAVAILABLE',
      latencyMs,
      error: err.message
    };
  }
}

export default {
  checkDbHealth
};
