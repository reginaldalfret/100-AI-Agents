/**
 * Sovereign AI Workbench - PostgreSQL Database Module
 * Authoritative persistent application state layer.
 */

export { dbConfig } from './config.js';
export { pool, query, getClient, closePool, setPool } from './client.js';
export { checkDbHealth } from './health.js';
export { runMigrations, getAppliedMigrations, initMigrationsTable } from './migrations/migrator.js';
export { ModelRepository } from './repositories/ModelRepository.js';
export { ArenaRepository } from './repositories/ArenaRepository.js';
export { JobRepository } from './repositories/JobRepository.js';
export { seedModels } from './seed/seed.js';
