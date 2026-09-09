import test, { describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { dbConfig } from '../../platform/database/config.js';
import { query, pool, getClient, closePool, setPool } from '../../platform/database/client.js';
import { checkDbHealth } from '../../platform/database/health.js';

describe('PostgreSQL Database Connection & Health Tests', () => {
  let originalPool;

  beforeEach(() => {
    originalPool = pool;
  });

  afterEach(async () => {
    if (pool !== originalPool) {
      setPool(originalPool);
    }
  });

  test('1. dbConfig provides valid sensible defaults', () => {
    assert.equal(typeof dbConfig.host, 'string');
    assert.equal(typeof dbConfig.port, 'number');
    assert.equal(typeof dbConfig.database, 'string');
    assert.equal(typeof dbConfig.user, 'string');
    assert.equal(typeof dbConfig.password, 'string');
    assert.equal(dbConfig.max, 10);
    assert.equal(dbConfig.idleTimeoutMillis, 30000);
    assert.equal(dbConfig.connectionTimeoutMillis, 5000);
    assert.equal(dbConfig.database, process.env.PG_DATABASE || 'superai_db');
  });

  test('2. query() enforces strict parameterization (rejects non-array params)', async () => {
    await assert.rejects(
      async () => {
        await query('SELECT * FROM models WHERE id = $1', 'non-array-param');
      },
      {
        name: 'TypeError',
        message: /Expected query params to be an Array/
      }
    );
  });

  test('3. checkDbHealth() returns standardized health contract without throwing', async () => {
    const health = await checkDbHealth();
    assert.ok(health);
    assert.ok(health.status === 'READY' || health.status === 'UNAVAILABLE');
    assert.equal(typeof health.latencyMs, 'number');
    assert.ok(health.latencyMs >= 0);

    if (health.status === 'READY') {
      assert.equal(health.error, null);
    } else {
      assert.equal(typeof health.error, 'string');
    }
  });

  test('4. Graceful degradation: handles offline database error safely in checkDbHealth', async () => {
    // Simulate an offline pool that rejects queries
    const mockOfflinePool = {
      query: async () => {
        throw new Error('Connection refused at 127.0.0.1:5432 (ECONNREFUSED)');
      },
      connect: async () => {
        throw new Error('Connection refused at 127.0.0.1:5432 (ECONNREFUSED)');
      },
      on: () => {},
      end: async () => {}
    };

    setPool(mockOfflinePool);

    const health = await checkDbHealth();
    assert.equal(health.status, 'UNAVAILABLE');
    assert.ok(health.error.includes('ECONNREFUSED'));
    assert.equal(typeof health.latencyMs, 'number');
  });

  test('5. Graceful degradation: query() logs warning and throws inspectable error when offline', async () => {
    const mockOfflinePool = {
      query: async () => {
        throw new Error('Database server offline');
      },
      on: () => {},
      end: async () => {}
    };

    setPool(mockOfflinePool);

    await assert.rejects(
      async () => {
        await query('SELECT 1', []);
      },
      /Database server offline/
    );
  });

  test('6. closePool() can be called safely', async () => {
    // Should resolve without error
    await assert.doesNotReject(async () => {
      await closePool();
    });
  });
});
