import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMigrations, initMigrationsTable } from '../../platform/database/migrations/migrator.js';
import { pool, setPool } from '../../platform/database/client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');

describe('PostgreSQL Schema & Migrator Tests', () => {
  const schemaFile = path.join(ROOT, 'platform', 'database', 'migrations', '001_initial_schema.sql');

  test('1. Migration file 001_initial_schema.sql exists and is readable', () => {
    assert.ok(fs.existsSync(schemaFile), '001_initial_schema.sql should exist');
    const content = fs.readFileSync(schemaFile, 'utf-8');
    assert.ok(content.length > 200, 'Schema file should have substantive content');
  });

  test('2. Schema contains deterministic DDL with IF NOT EXISTS for all 9 required tables', () => {
    const content = fs.readFileSync(schemaFile, 'utf-8');

    const requiredTables = [
      'models',
      'model_versions',
      'arena_comparisons',
      'arena_runs',
      'datasets',
      'dataset_versions',
      'fine_tuning_experiments',
      'jobs',
      'audit_events'
    ];

    for (const table of requiredTables) {
      const pattern = new RegExp(`CREATE TABLE IF NOT EXISTS\\s+${table}\\b`, 'i');
      assert.ok(
        pattern.test(content),
        `Schema must include "CREATE TABLE IF NOT EXISTS ${table}"`
      );
    }
  });

  test('3. Schema defines proper column definitions, foreign keys, and JSONB fields', () => {
    const content = fs.readFileSync(schemaFile, 'utf-8');

    // Models
    assert.ok(content.includes('model_id TEXT UNIQUE NOT NULL'), 'models requires model_id TEXT UNIQUE NOT NULL');
    assert.ok(content.includes('runtime_type TEXT'), 'models requires runtime_type TEXT');
    assert.ok(content.includes('vram_mb INT'), 'models requires vram_mb INT');

    // Arena references
    assert.ok(
      content.includes('REFERENCES arena_comparisons(id) ON DELETE CASCADE'),
      'arena_runs must reference arena_comparisons'
    );
    assert.ok(content.includes('tok_per_sec NUMERIC(8,2)'), 'arena_runs requires tok_per_sec NUMERIC(8,2)');

    // Dataset versions references
    assert.ok(
      content.includes('REFERENCES datasets(id) ON DELETE CASCADE'),
      'dataset_versions must reference datasets'
    );
    assert.ok(content.includes('schema_json JSONB'), 'dataset_versions requires schema_json JSONB');

    // Fine tuning & Jobs
    assert.ok(content.includes('hyperparameters JSONB'), 'fine_tuning_experiments requires hyperparameters JSONB');
    assert.ok(content.includes('payload JSONB'), 'jobs requires payload JSONB');
    assert.ok(content.includes('result JSONB'), 'jobs requires result JSONB');

    // Audit events
    assert.ok(content.includes('details JSONB'), 'audit_events requires details JSONB');
  });

  test('4. runMigrations() handles offline database gracefully without crashing', async () => {
    const originalPool = pool;
    const mockOffline = {
      query: async () => {
        throw new Error('connect ECONNREFUSED 127.0.0.1:5432');
      },
      on: () => {},
      end: async () => {}
    };

    setPool(mockOffline);

    try {
      const result = await runMigrations({ quiet: true });
      assert.equal(result.success, false);
      assert.equal(result.offline, true);
      assert.ok(result.error.includes('ECONNREFUSED'));
    } finally {
      setPool(originalPool);
    }
  });

  test('5. runMigrations() records applied migrations when database executes queries successfully', async () => {
    const originalPool = pool;
    const executedQueries = [];

    const mockOnline = {
      query: async (sql, params = []) => {
        executedQueries.push({ sql: sql.trim(), params });
        if (sql.includes('SELECT name FROM schema_migrations')) {
          return { rows: [] }; // No migrations applied yet
        }
        if (sql.includes('INSERT INTO schema_migrations')) {
          return { rowCount: 1, rows: [{ name: params[0] }] };
        }
        return { rows: [], rowCount: 1 };
      },
      on: () => {},
      end: async () => {}
    };

    setPool(mockOnline);

    try {
      const result = await runMigrations({ quiet: true });
      assert.equal(result.success, true);
      assert.equal(result.offline, false);
      assert.ok(result.applied.includes('001_initial_schema.sql'));
      assert.ok(executedQueries.some(q => q.sql.includes('CREATE TABLE IF NOT EXISTS schema_migrations')));
      assert.ok(executedQueries.some(q => q.sql.includes('INSERT INTO schema_migrations')));
    } finally {
      setPool(originalPool);
    }
  });
});
