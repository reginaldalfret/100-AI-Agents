/**
 * Sovereign AI Workbench - PostgreSQL Database Configuration
 * Sensible defaults with environment variable overrides for industrial deployment.
 */

export const dbConfig = {
  host: process.env.PG_HOST || '127.0.0.1',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  database: process.env.PG_DATABASE || 'superai_db',
  user: process.env.PG_USER || 'superai_user',
  password: process.env.PG_PASSWORD || 'superai_secure_pass_2026',
  max: parseInt(process.env.PG_MAX_CONNECTIONS || '10', 10),
  idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT_MS || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.PG_CONN_TIMEOUT_MS || '5000', 10)
};

export default dbConfig;
