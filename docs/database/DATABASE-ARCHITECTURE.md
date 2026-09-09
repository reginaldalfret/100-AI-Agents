# 301 SUPER AI — Multi-Engine Database Architecture Specification

**Document Version**: 2.1.0  
**Date**: September 8, 2026  
**Architecture Classification**: Sovereign Industrial Tri-Engine Data Fabric  
**Hardware Profile**: NVIDIA GeForce RTX 2050 Laptop GPU (4GB VRAM) / 16GB RAM / Air-Gapped Local Host  

---

## 1. Architectural Overview: Tri-Engine Data Fabric

The **301 SUPER AI** platform employs a decoupled **Tri-Engine Data Fabric** designed to eliminate contention between persistent transactional state, analytical queries on ad-hoc datasets, and hardware-constrained background job queues.

```mermaid
flowchart TD
    subgraph Clients["Clients & Gateways"]
        NextJS["Next.js App Router (Port 3000)"]
        Gateway["Central Gateway API (Port 8300)"]
    end

    subgraph DataFabric["301 SUPER AI Tri-Engine Data Fabric"]
        subgraph Tier1["Tier 1: Relational Metadata (PostgreSQL 16+)"]
            PG[(PostgreSQL 16+)]
            PG_Models["models & model_versions"]
            PG_Arena["arena_comparisons & arena_runs"]
            PG_Datasets["datasets & dataset_versions"]
            PG_Jobs["jobs & audit_events"]
            PG --- PG_Models
            PG --- PG_Arena
            PG --- PG_Datasets
            PG --- PG_Jobs
        end

        subgraph Tier2["Tier 2: Tabular Analytics (In-Memory DuckDB / SQLite)"]
            DuckDB[(In-Memory Analytical Engine)]
            CSV["CSV / XLSX / Parquet Parser"]
            AST_Guard["Read-Only SQL AST Security Guard"]
            DuckDB --- CSV
            DuckDB --- AST_Guard
        end

        subgraph Tier3["Tier 3: Distributed Queues (Redis + BullMQ)"]
            Redis[(Redis 7+)]
            BullMQ["BullMQ Worker Queues"]
            GPULock["Singleton GpuLock (RTX 2050 4GB)"]
            Redis --- BullMQ
            BullMQ --- GPULock
        end
    end

    Gateway -->|Transactional CRUD & Audit| PG
    Gateway -->|Ad-Hoc Data Exploration| DuckDB
    Gateway -->|Async Workload Dispatch| Redis
    NextJS -->|REST & SSE Requests| Gateway
```

---

## 2. Tier 1: PostgreSQL Enterprise Relational Store

PostgreSQL acts as the authoritative system-of-record for durable metadata, configurations, historical benchmarks, and governance audits.

### 2.1 Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    MODELS ||--o{ MODEL_VERSIONS : "tracks versions"
    MODELS ||--o{ FINE_TUNING_EXPERIMENTS : "acts as base model"
    DATASETS ||--o{ DATASET_VERSIONS : "maintains schema history"
    DATASETS ||--o{ FINE_TUNING_EXPERIMENTS : "supplies training pairs"
    ARENA_COMPARISONS ||--o{ ARENA_RUNS : "aggregates results"
    ARENA_RUNS }o--|| MODELS : "references model"
    JOBS ||--o{ AUDIT_EVENTS : "triggers audit trail"

    MODELS {
        UUID id PK "gen_random_uuid()"
        TEXT model_id UK "Unique model identifier"
        TEXT name "Human readable name"
        TEXT provider "ollama | peft | huggingface"
        TEXT runtime_type "ollama | transformers | peft"
        INT vram_mb "Estimated VRAM footprint"
        INT priority "Queue execution priority"
        TEXT status "active | ready | offline"
        TIMESTAMPTZ created_at "Creation timestamp"
        TIMESTAMPTZ updated_at "Update timestamp"
    }

    MODEL_VERSIONS {
        UUID id PK "gen_random_uuid()"
        TEXT model_id FK "References models(model_id)"
        TEXT version "Version tag (e.g., v1.0.0-q4)"
        TEXT weights_path "Local filesystem path"
        TEXT status "validated | archived"
        TIMESTAMPTZ created_at "Registration timestamp"
    }

    ARENA_COMPARISONS {
        UUID id PK "gen_random_uuid()"
        TEXT prompt "Benchmark prompt string"
        TEXT status "pending | running | completed | cancelled"
        TIMESTAMPTZ created_at "Start timestamp"
        TIMESTAMPTZ completed_at "Completion timestamp"
    }

    ARENA_RUNS {
        UUID id PK "gen_random_uuid()"
        UUID comparison_id FK "References arena_comparisons(id)"
        TEXT model_id "Model identifier evaluated"
        TEXT response_text "Generated output"
        INT token_count "Output token length"
        INT time_ms "Inference duration in ms"
        NUMERIC tok_per_sec "Computed tokens per second"
        TEXT status "completed | error | timeout"
        TIMESTAMPTZ created_at "Run timestamp"
    }

    DATASETS {
        UUID id PK "gen_random_uuid()"
        TEXT name "Dataset display name"
        TEXT file_path "Storage path on disk"
        TEXT format "csv | json | parquet | sql"
        INT row_count "Total validated records"
        TEXT status "ready | indexing | error"
        TIMESTAMPTZ created_at "Upload timestamp"
    }

    DATASET_VERSIONS {
        UUID id PK "gen_random_uuid()"
        UUID dataset_id FK "References datasets(id)"
        TEXT version "Semantic version"
        JSONB schema_json "Inferred column types and stats"
        TIMESTAMPTZ created_at "Snapshot timestamp"
    }

    FINE_TUNING_EXPERIMENTS {
        UUID id PK "gen_random_uuid()"
        TEXT name "Experiment name"
        TEXT base_model "Base model identifier"
        UUID dataset_id FK "References datasets(id)"
        JSONB hyperparameters "Epochs, lr, lora_r, lora_alpha"
        TEXT status "queued | running | completed | failed"
        TIMESTAMPTZ created_at "Start timestamp"
    }

    JOBS {
        UUID id PK "gen_random_uuid()"
        TEXT job_type "arena | finetune | ingest"
        TEXT status "waiting | active | completed | failed"
        JSONB payload "Job parameters and configuration"
        JSONB result "Output metrics, artifacts, or error"
        TIMESTAMPTZ created_at "Creation timestamp"
        TIMESTAMPTZ updated_at "Status update timestamp"
    }

    AUDIT_EVENTS {
        UUID id PK "gen_random_uuid()"
        TEXT event_type "MODEL_RUN | DATASET_UPLOAD | SECURITY_ALERT"
        JSONB details "Contextual metadata and actor info"
        TIMESTAMPTZ created_at "Event timestamp"
    }
```

### 2.2 Indexing & Performance Strategy
1. **Lookup Accelerators**:
   - `CREATE INDEX idx_models_model_id ON models(model_id);`
   - `CREATE INDEX idx_model_versions_model_id ON model_versions(model_id);`
2. **Relational Joins**:
   - `CREATE INDEX idx_arena_runs_comparison_id ON arena_runs(comparison_id);`
   - `CREATE INDEX idx_dataset_versions_dataset_id ON dataset_versions(dataset_id);`
3. **Queue & Audit Filtering**:
   - `CREATE INDEX idx_jobs_status ON jobs(status);`
   - `CREATE INDEX idx_jobs_type ON jobs(job_type);`
   - `CREATE INDEX idx_audit_events_type ON audit_events(event_type);`

---

## 3. Tier 2: In-Memory DuckDB / Tabular SQL Engine

The analytical tier is implemented in `platform/datasets/sql-engine.js` and provides sub-millisecond querying over tabular data without contaminating persistent relational tables with ad-hoc schemas.

### 3.1 Security Sandbox & AST Validation (`validateReadOnlySQL`)
Before query execution, incoming SQL is parsed and inspected against a strict security policy:
- **Disallowed Multiple Statements**: Semicolon inspection outside string literals prevents query stacking and SQL injection.
- **Strict Read-Only Enforcement**: Query must start with `SELECT`, `WITH`, or `EXPLAIN`.
- **Forbidden DDL/DML Keywords**:
  `DROP`, `DELETE`, `UPDATE`, `INSERT`, `ALTER`, `CREATE`, `TRUNCATE`, `REPLACE`, `UPSERT`, `ATTACH`, `DETACH`, `PRAGMA`, `VACUUM`, `LOAD_EXTENSION`, `SYSTEM`, `EXEC`.
- **Memory Lifetime**: Data is parsed into memory structures on ingestion and garbage-collected upon dataset deletion.

```mermaid
sequenceDiagram
    participant User as User / Agent Analyst
    participant Gateway as Dataset Gateway
    participant Guard as AST Security Guard
    participant Engine as In-Memory SQL Engine
    
    User->>Gateway: POST /api/datasets/:id/query { sql: "SELECT department, AVG(gpa) FROM dataset GROUP BY 1" }
    Gateway->>Guard: validateReadOnlySQL(sql)
    alt Security Violation Detected
        Guard-->>Gateway: { valid: false, error: "SECURITY_VIOLATION: ..." }
        Gateway-->>User: 403 Forbidden { error }
    else Valid Query
        Guard-->>Gateway: { valid: true, cleanSql }
        Gateway->>Engine: executeDatasetSQL(datasetId, cleanSql)
        Engine->>Engine: Run query with max 5000 row cap
        Engine-->>Gateway: { columns, rows, rowCount, executionTimeMs }
        Gateway-->>User: 200 OK { results }
    end
```

---

## 4. Tier 3: Redis + BullMQ Job Queue Subsystem

Background operations that require substantial compute or access to the local GPU are orchestrated asynchronously through Redis 7+ and BullMQ (`platform/jobs/`).

### 4.1 Queue Topologies
- **`superai:model-arena`**: Manages model evaluation comparisons across local LLMs.
- **`superai:finetune`**: Manages LoRA/QLoRA training jobs using the Python PEFT worker.
- **`superai:dataset-ingest`**: Processes large CSV/Parquet uploads, calculates summary statistics, and embeds documentation.

### 4.2 Hardware GPU Mutual Exclusion (`GpuLock`)
The system runs on an NVIDIA GeForce RTX 2050 with a strict 4096 MB VRAM ceiling. Concurrent model loads trigger CUDA out-of-memory (OOM) errors. The queue worker integrates with `GpuLock` (`platform/jobs/gpu-lock.js`):

```mermaid
stateDiagram-v2
    [*] --> Idle : System Startup
    Idle --> Queued : Job Enqueued in BullMQ
    Queued --> WaitingForGpu : Worker Picks Up Job
    WaitingForGpu --> GpuAcquired : gpuLock.acquire() resolves
    GpuAcquired --> RunningInference : Load Weights & Stream Tokens
    RunningInference --> ReleasingGpu : Generation Complete / Failed
    ReleasingGpu --> Idle : gpuLock.release()
    ReleasingGpu --> Completed : Write Results to PostgreSQL
```

---

## 5. Cross-Database Interoperability & Data Flow

```mermaid
flowchart TD
    subgraph IngestionFlow["1. Ingestion Phase"]
        Upload[Upload CSV / Parquet] --> Disk[Save to File Storage]
        Disk --> IngestWorker[BullMQ Ingest Queue]
        IngestWorker --> LoadDuck[Load into In-Memory SQL Table]
        IngestWorker --> MetaPG[Record in PostgreSQL datasets & dataset_versions]
    end

    subgraph AnalysisFlow["2. Analytical Exploration"]
        Agent[Autonomous Agent] --> Ask[Natural Language Query]
        Ask --> SQLGen[Generate Read-Only SQL]
        SQLGen --> ASTCheck[Read-Only AST Validation]
        ASTCheck --> DuckQuery[Execute in DuckDB / SQLite]
        DuckQuery --> Agent
    end

    subgraph TrainingFlow["3. QLoRA Training Pipeline"]
        Agent --> TriggerTrain[Trigger Fine-Tuning Job]
        TriggerTrain --> BullTrain[BullMQ Training Queue]
        BullTrain --> GPUMutex[Acquire GpuLock]
        GPUMutex --> PythonWorker[Python PEFT LoRA Training]
        PythonWorker --> LogExp[Log Metrics to PostgreSQL fine_tuning_experiments]
        PythonWorker --> ReleaseMutex[Release GpuLock]
        ReleaseMutex --> RegModel[Register New Model in models & model_versions]
    end
```

---

## 6. Disaster Recovery, Backup & Air-Gapped Migration Strategy

### 6.1 Database Backup Strategy
- **Logical Backups**:
  Daily automated snapshot using `pg_dump`:
  ```bash
  pg_dump -h localhost -U superai_user -d superai_db -Fc -f /backup/superai_db_$(date +%Y%m%d).dump
  ```
- **Air-Gapped Cold Storage**:
  Backups and model adapter checkpoints are stored on encrypted, sovereign local volumes without reliance on external cloud storage.

### 6.2 Schema Evolution & Migrations
- Migration files are strictly numbered (`001_initial_schema.sql`, `002_*.sql`).
- All migrations are idempotent, tested against clean instances, and tracked in `schema_migrations`.
- Down migrations and rollback procedures are formally documented and automated in `migrator.js`.

---

## 7. Architecture Verification Summary

| Component | Technology | Concurrency Model | Primary Safety Gate |
| :--- | :--- | :--- | :--- |
| **Relational Metadata** | PostgreSQL 16+ | Connection Pool (`max: 10`) | Foreign keys, UUID constraints, ACID transactions |
| **Tabular Analytics** | In-Memory DuckDB / SQLite | Isolated per-dataset instances | `validateReadOnlySQL` AST security parser |
| **Job Queues** | Redis 7+ / BullMQ | FIFO Queue Worker | `GpuLock` singleton 1-at-a-time GPU hardware gate |
| **Model Registry** | PostgreSQL + Filesystem | Read-heavy caching | Version hash checking and VRAM reservation |
