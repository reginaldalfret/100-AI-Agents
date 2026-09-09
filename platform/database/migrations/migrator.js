/**
 * Sovereign AI Workbench - PostgreSQL Database Migrator
 * Runs versioned SQL migrations deterministically and tracks applied versions in schema_migrations.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query, closePool } from '../client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = __dirname;

/**
 * Ensure the schema_migrations tracking table exists.
 */
export async function initMigrationsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

/**
 * Retrieve the list of migration names that have already been applied.
 * @returns {Promise<string[]>}
 */
export async function getAppliedMigrations() {
  try {
    await initMigrationsTable();
    const result = await query('SELECT name FROM schema_migrations ORDER BY id ASC');
    return result.rows.map(r => r.name);
  } catch (err) {
    console.warn('[PostgreSQL Migrator Warning] Unable to get applied migrations:', err.message);
    throw err;
  }
}

/**
 * Run all pending migrations in alphabetical order.
 * 
 * @param {Object} [options]
 * @param {boolean} [options.quiet=false]
 * @returns {Promise<{ success: boolean, applied: string[], offline: boolean, error?: string }>}
 */
export async function runMigrations({ quiet = false } = {}) {
  const applied = [];
  try {
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (!quiet) {
      console.log(`[PostgreSQL Migrator] Found ${files.length} migration file(s) in ${MIGRATIONS_DIR}`);
    }

    const alreadyApplied = await getAppliedMigrations();

    for (const file of files) {
      if (alreadyApplied.includes(file)) {
        if (!quiet) {
          console.log(`[PostgreSQL Migrator] Skipping already applied migration: ${file}`);
        }
        continue;
      }

      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      if (!quiet) {
        console.log(`[PostgreSQL Migrator] Applying migration: ${file}...`);
      }

      // Execute migration script
      await query(sql);

      // Record migration execution
      await query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      applied.push(file);

      if (!quiet) {
        console.log(`[PostgreSQL Migrator] Successfully applied: ${file}`);
      }
    }

    return { success: true, applied, offline: false };
  } catch (err) {
    console.warn(`[PostgreSQL Migrator Warning] Migration failed or database offline: ${err.message}`);
    return {
      success: false,
      applied,
      offline: true,
      error: err.message
    };
  }
}

// Auto-run if executed directly as CLI script
const isMain = process.argv[1] && (
  path.resolve(process.argv[1]) === path.resolve(__filename) ||
  process.argv[1].endsWith('migrator.js')
);

if (isMain) {
  runMigrations()
    .then((res) => {
      if (res.success) {
        console.log(`[PostgreSQL Migrator] Finished. ${res.applied.length} new migration(s) applied.`);
      } else {
        console.warn(`[PostgreSQL Migrator] Completed with warnings (Database offline or error): ${res.error}`);
      }
      return closePool();
    })
    .catch((err) => {
      console.error('[PostgreSQL Migrator Fatal]', err);
      process.exit(1);
    });
}

export default {
  initMigrationsTable,
  getAppliedMigrations,
  runMigrations
};
