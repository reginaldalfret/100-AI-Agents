/**
 * Sovereign AI Workbench - PostgreSQL Client & Connection Pooling
 * Safe connection pooling, parameterized queries only, and graceful degradation.
 */

import pg from 'pg';
import { dbConfig } from './config.js';

const { Pool } = pg;

export let pool = new Pool(dbConfig);

// Handle idle client errors without crashing the Node.js process
pool.on('error', (err) => {
  console.warn('[PostgreSQL Pool Warning] Unexpected idle client error:', err.message);
});

/**
 * Execute a safe parameterized query against PostgreSQL.
 * Strict parameterization: values must only be passed through the `params` array.
 * 
 * @param {string} text - Parameterized SQL query string (using $1, $2, etc.)
 * @param {Array<any>} [params=[]] - Array of query parameters
 * @returns {Promise<pg.QueryResult>}
 */
export async function query(text, params = []) {
  if (!Array.isArray(params)) {
    throw new TypeError(`[PostgreSQL] Expected query params to be an Array, received ${typeof params}`);
  }

  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    console.warn(`[PostgreSQL Query Warning] Failed to execute query: ${err.message}`);
    throw err;
  }
}

/**
 * Acquire a dedicated client from the connection pool.
 * Remember to call client.release() when done!
 * 
 * @returns {Promise<pg.PoolClient>}
 */
export async function getClient() {
  try {
    const client = await pool.connect();
    return client;
  } catch (err) {
    console.warn(`[PostgreSQL getClient Warning] Could not acquire client: ${err.message}`);
    throw err;
  }
}

/**
 * Gracefully close the connection pool and all idle clients.
 */
export async function closePool() {
  try {
    if (pool && !pool.ending && !pool.ended) {
      await pool.end();
    }
  } catch (err) {
    console.warn(`[PostgreSQL closePool Warning] Error closing connection pool: ${err.message}`);
  }
}

/**
 * Re-initialize or override pool (useful for testing or reconnecting).
 * @param {pg.Pool} [newPool]
 */
export function setPool(newPool) {
  pool = newPool || new Pool(dbConfig);
  pool.on('error', (err) => {
    console.warn('[PostgreSQL Pool Warning] Unexpected idle client error:', err.message);
  });
  return pool;
}

export default {
  pool,
  query,
  getClient,
  closePool,
  setPool
};
