import test, { describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { pool, setPool } from '../../platform/database/client.js';
import { ModelRepository } from '../../platform/database/repositories/ModelRepository.js';
import { ArenaRepository } from '../../platform/database/repositories/ArenaRepository.js';
import { JobRepository } from '../../platform/database/repositories/JobRepository.js';
import { seedModels } from '../../platform/database/seed/seed.js';

describe('PostgreSQL Repositories & Seed Tests', () => {
  let originalPool;

  beforeEach(() => {
    originalPool = pool;
  });

  afterEach(() => {
    if (pool !== originalPool) {
      setPool(originalPool);
    }
  });

  describe('ModelRepository Tests', () => {
    test('1. ModelRepository.findAll() returns models (gracefully falling back if offline)', async () => {
      const models = await ModelRepository.findAll();
      assert.ok(Array.isArray(models));
      assert.ok(models.length > 0);
      const nemotron = models.find(m => m.model_id === 'nemotron-3-nano');
      assert.ok(nemotron);
    });

    test('2. ModelRepository.findById() retrieves specific model definition', async () => {
      const model = await ModelRepository.findById('nemotron-3-nano');
      assert.ok(model);
      assert.equal(model.model_id, 'nemotron-3-nano');

      const nonExistent = await ModelRepository.findById('non-existent-model-xyz');
      assert.equal(nonExistent, null);
    });

    test('3. ModelRepository.upsert() throws if model_id is missing', async () => {
      await assert.rejects(
        async () => {
          await ModelRepository.upsert({});
        },
        /model_id is required/
      );
    });

    test('4. ModelRepository.upsert() handles upsert with database queries', async () => {
      const queries = [];
      const mockDb = {
        query: async (sql, params) => {
          queries.push({ sql, params });
          return {
            rows: [{
              id: 'uuid-1234',
              model_id: params[0],
              name: params[1],
              provider: params[2],
              runtime_type: params[3],
              vram_mb: params[4],
              priority: params[5],
              status: params[6]
            }]
          };
        },
        on: () => {},
        end: async () => {}
      };

      setPool(mockDb);

      const result = await ModelRepository.upsert({
        model_id: 'custom-model-1',
        name: 'Custom Model 1',
        provider: 'Meta',
        runtime_type: 'OLLAMA',
        vram_mb: 2048,
        priority: 1,
        status: 'ready'
      });

      assert.equal(result.model_id, 'custom-model-1');
      assert.equal(result.vram_mb, 2048);
      assert.ok(queries[0].sql.includes('ON CONFLICT (model_id) DO UPDATE'));
      assert.deepEqual(queries[0].params, [
        'custom-model-1',
        'Custom Model 1',
        'Meta',
        'OLLAMA',
        2048,
        1,
        'ready'
      ]);
    });
  });

  describe('ArenaRepository Tests', () => {
    test('5. ArenaRepository creates comparison session and adds runs', async () => {
      const comparison = await ArenaRepository.createComparison('Explain quantum computing');
      assert.ok(comparison);
      assert.ok(comparison.id);
      assert.equal(comparison.prompt, 'Explain quantum computing');
      assert.equal(comparison.status, 'PENDING');

      const run1 = await ArenaRepository.addRun(comparison.id, {
        model_id: 'nemotron-3-nano',
        response_text: 'Quantum computing leverages qubits...',
        token_count: 50,
        time_ms: 1200,
        tok_per_sec: 41.67,
        status: 'COMPLETED'
      });

      assert.ok(run1);
      assert.equal(run1.comparison_id, comparison.id);
      assert.equal(run1.model_id, 'nemotron-3-nano');

      const fullComparison = await ArenaRepository.getComparisonWithRuns(comparison.id);
      assert.ok(fullComparison);
      assert.equal(fullComparison.id, comparison.id);
      assert.ok(Array.isArray(fullComparison.runs));
      assert.equal(fullComparison.runs.length, 1);
      assert.equal(fullComparison.runs[0].model_id, 'nemotron-3-nano');
    });

    test('6. ArenaRepository validation rules throw on missing required fields', async () => {
      await assert.rejects(
        async () => {
          await ArenaRepository.createComparison('');
        },
        /prompt is required/
      );

      await assert.rejects(
        async () => {
          await ArenaRepository.addRun('', { model_id: 'nemotron-3-nano' });
        },
        /comparisonId is required/
      );

      await assert.rejects(
        async () => {
          await ArenaRepository.addRun('some-comp-id', {});
        },
        /model_id is required/
      );
    });

    test('7. ArenaRepository.getRecentComparisons() returns comparisons array', async () => {
      const recent = await ArenaRepository.getRecentComparisons(5);
      assert.ok(Array.isArray(recent));
    });
  });

  describe('JobRepository Tests', () => {
    test('8. JobRepository lifecycle: createJob, updateStatus, getJob', async () => {
      const job = await JobRepository.createJob('FINE_TUNE', { dataset_id: 'dataset-abc', epochs: 3 });
      assert.ok(job);
      assert.ok(job.id);
      assert.equal(job.job_type, 'FINE_TUNE');
      assert.equal(job.status, 'QUEUED');

      // Update status to COMPLETED
      const updated = await JobRepository.updateStatus(job.id, 'COMPLETED', { loss: 0.045, artifact_path: '/models/adapter' });
      assert.ok(updated);
      assert.equal(updated.status, 'COMPLETED');
      assert.deepEqual(updated.result, { loss: 0.045, artifact_path: '/models/adapter' });

      // Retrieve job
      const fetched = await JobRepository.getJob(job.id);
      assert.ok(fetched);
      assert.equal(fetched.id, job.id);
      assert.equal(fetched.status, 'COMPLETED');
    });

    test('9. JobRepository validates required inputs', async () => {
      await assert.rejects(
        async () => {
          await JobRepository.createJob('');
        },
        /job_type is required/
      );

      await assert.rejects(
        async () => {
          await JobRepository.updateStatus('', 'COMPLETED');
        },
        /jobId is required/
      );

      await assert.rejects(
        async () => {
          await JobRepository.updateStatus('job-1', '');
        },
        /status is required/
      );
    });
  });

  describe('Database Seeder Tests', () => {
    test('10. seedModels() executes and reports seeded model count', async () => {
      const res = await seedModels({ quiet: true });
      assert.ok(res);
      assert.ok(res.seededCount > 0);
      assert.equal(typeof res.success, 'boolean');
    });
  });
});
