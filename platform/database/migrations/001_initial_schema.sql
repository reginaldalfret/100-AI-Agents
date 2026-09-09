-- Sovereign AI Workbench — Initial Application Database Schema
-- Migration: 001_initial_schema.sql
-- Deterministic DDL with IF NOT EXISTS for persistent application state.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Models registry table
CREATE TABLE IF NOT EXISTS models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id TEXT UNIQUE NOT NULL,
  name TEXT,
  provider TEXT,
  runtime_type TEXT,
  vram_mb INT,
  priority INT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Model versions
CREATE TABLE IF NOT EXISTS model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id TEXT NOT NULL,
  version TEXT,
  weights_path TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Arena comparisons
CREATE TABLE IF NOT EXISTS arena_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT
);

-- 4. Arena runs
CREATE TABLE IF NOT EXISTS arena_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comparison_id UUID REFERENCES arena_comparisons(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  response_text TEXT,
  token_count INT,
  time_ms INT,
  tok_per_sec NUMERIC(8,2),
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Datasets
CREATE TABLE IF NOT EXISTS datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  file_path TEXT,
  format TEXT,
  row_count INT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Dataset versions
CREATE TABLE IF NOT EXISTS dataset_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  version TEXT,
  schema_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Fine-tuning experiments
CREATE TABLE IF NOT EXISTS fine_tuning_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base_model TEXT,
  dataset_id UUID,
  hyperparameters JSONB,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Jobs
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  status TEXT NOT NULL,
  payload JSONB,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Audit events
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Essential Performance Indexes
CREATE INDEX IF NOT EXISTS idx_models_model_id ON models(model_id);
CREATE INDEX IF NOT EXISTS idx_model_versions_model_id ON model_versions(model_id);
CREATE INDEX IF NOT EXISTS idx_arena_runs_comparison_id ON arena_runs(comparison_id);
CREATE INDEX IF NOT EXISTS idx_dataset_versions_dataset_id ON dataset_versions(dataset_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_type ON audit_events(event_type);
