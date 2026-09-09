/**
 * Sovereign AI Workbench - Model Repository
 * Persistent storage operations for registered AI models.
 * Parameterized queries only with graceful fallback to local registry when offline.
 */

import { query } from '../client.js';
import { LOCAL_MODELS, getModelById as getLocalModelById } from '../../models/model-registry.js';

export class ModelRepository {
  /**
   * Find all registered models ordered by priority and name.
   * @returns {Promise<Array<Object>>}
   */
  static async findAll() {
    try {
      const res = await query('SELECT * FROM models ORDER BY priority ASC, name ASC');
      return res.rows;
    } catch (err) {
      console.warn('[ModelRepository Warning] Database offline or error, falling back to LOCAL_MODELS:', err.message);
      return [...LOCAL_MODELS];
    }
  }

  /**
   * Find a single model by its unique model_id.
   * @param {string} modelId 
   * @returns {Promise<Object|null>}
   */
  static async findById(modelId) {
    if (!modelId) return null;
    try {
      const res = await query('SELECT * FROM models WHERE model_id = $1 LIMIT 1', [modelId]);
      if (res.rows.length > 0) {
        return res.rows[0];
      }
      return null;
    } catch (err) {
      console.warn(`[ModelRepository Warning] Database offline or error looking up ${modelId}, falling back to local registry:`, err.message);
      const local = getLocalModelById(modelId);
      return local || null;
    }
  }

  /**
   * Insert or update a model record.
   * @param {Object} modelData
   * @returns {Promise<Object>}
   */
  static async upsert(modelData) {
    if (!modelData || !modelData.model_id) {
      throw new Error('[ModelRepository] model_id is required for upsert');
    }

    const {
      model_id,
      name = null,
      provider = null,
      runtime_type = modelData.runtime || null,
      vram_mb = 0,
      priority = 1,
      status = 'ready'
    } = modelData;

    const vramInt = parseInt(vram_mb || 0, 10);
    const priorityInt = parseInt(priority || 1, 10);

    const sql = `
      INSERT INTO models (model_id, name, provider, runtime_type, vram_mb, priority, status, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (model_id) DO UPDATE SET
        name = EXCLUDED.name,
        provider = EXCLUDED.provider,
        runtime_type = EXCLUDED.runtime_type,
        vram_mb = EXCLUDED.vram_mb,
        priority = EXCLUDED.priority,
        status = EXCLUDED.status,
        updated_at = NOW()
      RETURNING *;
    `;

    try {
      const res = await query(sql, [model_id, name, provider, runtime_type, vramInt, priorityInt, status]);
      return res.rows[0];
    } catch (err) {
      console.warn(`[ModelRepository Warning] Database offline or error upserting ${model_id}:`, err.message);
      return {
        id: `offline-${model_id}`,
        model_id,
        name,
        provider,
        runtime_type,
        vram_mb: vramInt,
        priority: priorityInt,
        status,
        updated_at: new Date().toISOString()
      };
    }
  }
}

export default ModelRepository;
