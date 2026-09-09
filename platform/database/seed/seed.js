/**
 * Sovereign AI Workbench - PostgreSQL Database Seeder
 * Reads authoritative model definitions from LOCAL_MODELS and populates the models table.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCAL_MODELS } from '../../models/model-registry.js';
import { ModelRepository } from '../repositories/ModelRepository.js';
import { closePool } from '../client.js';

const __filename = fileURLToPath(import.meta.url);

/**
 * Seed registered local models into PostgreSQL.
 * @param {Object} [options]
 * @param {boolean} [options.quiet=false]
 * @returns {Promise<{ seededCount: number, success: boolean, error?: string }>}
 */
export async function seedModels({ quiet = false } = {}) {
  if (!quiet) {
    console.log(`[PostgreSQL Seed] Starting seed with ${LOCAL_MODELS.length} local models from registry...`);
  }

  let count = 0;
  try {
    for (const model of LOCAL_MODELS) {
      await ModelRepository.upsert({
        model_id: model.model_id,
        name: model.name || model.model_id,
        provider: model.provider || 'Local',
        runtime_type: model.runtime_type || model.runtime || 'OLLAMA',
        vram_mb: model.vram_mb || 0,
        priority: model.priority || 1,
        status: model.status || 'ready'
      });
      count++;
    }

    if (!quiet) {
      console.log(`[PostgreSQL Seed] Successfully upserted ${count} models.`);
    }
    return { seededCount: count, success: true };
  } catch (err) {
    console.warn(`[PostgreSQL Seed Warning] Seed encountered error or database offline: ${err.message}`);
    return { seededCount: count, success: false, error: err.message };
  }
}

// Auto-run if executed directly as CLI script
const isMain = process.argv[1] && (
  path.resolve(process.argv[1]) === path.resolve(__filename) ||
  process.argv[1].endsWith('seed.js')
);

if (isMain) {
  seedModels()
    .then((res) => {
      if (res.success) {
        console.log(`[PostgreSQL Seed] Finished seeding ${res.seededCount} models.`);
      } else {
        console.warn(`[PostgreSQL Seed] Finished with warnings (offline/partial): ${res.error}`);
      }
      return closePool();
    })
    .catch((err) => {
      console.error('[PostgreSQL Seed Fatal]', err);
      process.exit(1);
    });
}

export default {
  seedModels
};
