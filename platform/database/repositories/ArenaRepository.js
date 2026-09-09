/**
 * Sovereign AI Workbench - Model Arena Repository
 * Manages head-to-head model comparison sessions and inference run telemetry.
 * Safe parameterized queries only with in-memory degradation fallback when database is offline.
 */

import { randomUUID } from 'node:crypto';
import { query } from '../client.js';

// In-memory fallback stores for air-gapped / offline degradation
const fallbackComparisons = new Map();
const fallbackRuns = [];

export class ArenaRepository {
  /**
   * Create a new head-to-head comparison session.
   * @param {string} prompt
   * @returns {Promise<Object>}
   */
  static async createComparison(prompt) {
    if (!prompt) {
      throw new Error('[ArenaRepository] prompt is required to create a comparison');
    }

    const sql = `
      INSERT INTO arena_comparisons (prompt, status, created_at)
      VALUES ($1, 'PENDING', NOW())
      RETURNING *;
    `;

    try {
      const res = await query(sql, [prompt]);
      return res.rows[0];
    } catch (err) {
      console.warn('[ArenaRepository Warning] Database offline, storing comparison in-memory:', err.message);
      const offlineRecord = {
        id: randomUUID(),
        prompt,
        status: 'PENDING',
        created_at: new Date().toISOString(),
        completed_at: null
      };
      fallbackComparisons.set(offlineRecord.id, offlineRecord);
      return offlineRecord;
    }
  }

  /**
   * Add a model run record associated with an arena comparison.
   * @param {string} comparisonId
   * @param {Object} runData
   * @returns {Promise<Object>}
   */
  static async addRun(comparisonId, runData) {
    if (!comparisonId) {
      throw new Error('[ArenaRepository] comparisonId is required to record a run');
    }
    if (!runData || !runData.model_id) {
      throw new Error('[ArenaRepository] model_id is required in runData');
    }

    const {
      model_id,
      response_text = '',
      token_count = 0,
      time_ms = 0,
      tok_per_sec = 0,
      status = 'COMPLETED'
    } = runData;

    const sql = `
      INSERT INTO arena_runs (
        comparison_id,
        model_id,
        response_text,
        token_count,
        time_ms,
        tok_per_sec,
        status,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *;
    `;

    try {
      const res = await query(sql, [
        comparisonId,
        model_id,
        response_text,
        parseInt(token_count || 0, 10),
        parseInt(time_ms || 0, 10),
        parseFloat(tok_per_sec || 0),
        status
      ]);
      return res.rows[0];
    } catch (err) {
      console.warn('[ArenaRepository Warning] Database offline, storing run in-memory:', err.message);
      const offlineRun = {
        id: randomUUID(),
        comparison_id: comparisonId,
        model_id,
        response_text,
        token_count: parseInt(token_count || 0, 10),
        time_ms: parseInt(time_ms || 0, 10),
        tok_per_sec: parseFloat(tok_per_sec || 0),
        status,
        created_at: new Date().toISOString()
      };
      fallbackRuns.push(offlineRun);
      return offlineRun;
    }
  }

  /**
   * Retrieve comparison details along with all associated runs.
   * @param {string} comparisonId
   * @returns {Promise<Object|null>}
   */
  static async getComparisonWithRuns(comparisonId) {
    if (!comparisonId) return null;

    try {
      const compRes = await query('SELECT * FROM arena_comparisons WHERE id = $1 LIMIT 1', [comparisonId]);
      if (compRes.rows.length === 0) {
        return null;
      }
      const comparison = compRes.rows[0];

      const runsRes = await query(
        'SELECT * FROM arena_runs WHERE comparison_id = $1 ORDER BY created_at ASC',
        [comparisonId]
      );
      comparison.runs = runsRes.rows;
      return comparison;
    } catch (err) {
      console.warn(`[ArenaRepository Warning] Database offline, reading comparison ${comparisonId} from in-memory store:`, err.message);
      const comparison = fallbackComparisons.get(comparisonId);
      if (!comparison) return null;
      const runs = fallbackRuns.filter(r => r.comparison_id === comparisonId);
      return { ...comparison, runs };
    }
  }

  /**
   * Get the most recent comparisons.
   * @param {number} [limit=10]
   * @returns {Promise<Array<Object>>}
   */
  static async getRecentComparisons(limit = 10) {
    const limitInt = Math.max(1, parseInt(limit || 10, 10));

    try {
      const res = await query(
        'SELECT * FROM arena_comparisons ORDER BY created_at DESC LIMIT $1',
        [limitInt]
      );
      return res.rows;
    } catch (err) {
      console.warn('[ArenaRepository Warning] Database offline, returning recent in-memory comparisons:', err.message);
      return Array.from(fallbackComparisons.values())
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limitInt);
    }
  }
}

export default ArenaRepository;
