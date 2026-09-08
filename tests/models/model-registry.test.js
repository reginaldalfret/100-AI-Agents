import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LOCAL_MODELS, getModelById, listAvailableModels, ModelModality } from '../../platform/models/model-registry.js';

describe('Model Registry Specification & Integrity Test Suite', () => {
  describe('Modality Constants', () => {
    it('defines all required core modalities in ModelModality', () => {
      assert.equal(ModelModality.TEXT, 'text');
      assert.equal(ModelModality.VISION, 'vision');
      assert.equal(ModelModality.CODE, 'code');
      assert.equal(ModelModality.OCR, 'ocr');
      assert.equal(ModelModality.EMBEDDING, 'embedding');
    });
  });

  describe('Registry Completeness & Expected Models', () => {
    const expectedModelIds = [
      'nemotron-3-nano',
      'local-vision-ocr',
      'gemma3-1b',
      'local-code-specialist',
      'llama3.2-1b',
      'granite4-1b-h',
      'phi4-mini',
      'smollm2-1.7b',
      'lfm2.5-350m',
      'rwkv7-0.4b',
      'tinyllama-1.1b',
      'stablelm2-1.6b',
      'falcon3-1b-instruct'
    ];

    it('contains all required production models in LOCAL_MODELS', () => {
      const registeredIds = LOCAL_MODELS.map(m => m.model_id);
      for (const expectedId of expectedModelIds) {
        assert.ok(registeredIds.includes(expectedId), `Missing model in registry: ${expectedId}`);
      }
    });

    it('listAvailableModels() returns complete list of models', () => {
      const models = listAvailableModels();
      assert.equal(models.length, LOCAL_MODELS.length);
      assert.deepEqual(models, LOCAL_MODELS);
    });

    it('getModelById returns correct model object or null for unknown IDs', () => {
      for (const id of expectedModelIds) {
        const m = getModelById(id);
        assert.ok(m, `getModelById("${id}") must not be null`);
        assert.equal(m.model_id, id);
      }

      assert.equal(getModelById('unknown-model-xyz'), null);
      assert.equal(getModelById(''), null);
    });
  });

  describe('Schema Validation on Every Registered Model', () => {
    for (const model of LOCAL_MODELS) {
      it(`validates schema integrity for model: ${model.model_id}`, () => {
        assert.ok(typeof model.model_id === 'string' && model.model_id.length > 0, 'model_id must be a non-empty string');
        assert.ok(typeof model.name === 'string' && model.name.length > 0, 'name must be a non-empty string');
        assert.ok(typeof model.provider === 'string', 'provider must be a string');
        assert.ok(typeof model.runtime === 'string', 'runtime must be a string');
        assert.ok(typeof model.endpoint === 'string', 'endpoint must be a string');
        assert.ok(model.endpoint.startsWith('http://127.0.0.1') || model.endpoint.startsWith('http://localhost'), 'endpoint must be local loopback');
        assert.ok(typeof model.quantization === 'string', 'quantization must be a string');
        if (model.execution_target === 'CPU') {
          assert.ok(typeof model.vram_mb === 'number' && model.vram_mb === 0, 'CPU model vram_mb must be 0');
        } else {
          assert.ok(typeof model.vram_mb === 'number' && model.vram_mb > 0, 'GPU model vram_mb must be a positive number');
        }
        assert.ok(typeof model.ram_mb === 'number' && model.ram_mb > 0, 'ram_mb must be a positive number');
        assert.ok(typeof model.context_length === 'number' && model.context_length > 0, 'context_length must be positive');
        assert.ok(Array.isArray(model.supported_modalities) && model.supported_modalities.length > 0, 'supported_modalities must be a non-empty array');
        assert.ok(Array.isArray(model.capabilities) && model.capabilities.length > 0, 'capabilities must be a non-empty array');
        assert.ok(Array.isArray(model.recommended_tasks) && model.recommended_tasks.length > 0, 'recommended_tasks must be a non-empty array');
        assert.ok(typeof model.priority === 'number' && model.priority >= 1, 'priority must be a positive number');
        assert.ok(model.status === 'ready' || model.status === 'EXPERIMENTAL' || model.status === 'VALIDATED', 'status must be ready, EXPERIMENTAL, or VALIDATED');
      });
    }
  });

  describe('Hardware Budget & Sovereign Isolation Constraints', () => {
    it('verifies all model VRAM budgets fit within the RTX 2050 4096MB VRAM bound', () => {
      const RTX_2050_MAX_VRAM_MB = 4096;
      for (const model of LOCAL_MODELS) {
        assert.ok(
          model.vram_mb <= RTX_2050_MAX_VRAM_MB,
          `Model ${model.model_id} VRAM (${model.vram_mb} MB) exceeds RTX 2050 bound of ${RTX_2050_MAX_VRAM_MB} MB`
        );
      }
    });

    it('verifies no deprecated models are in active registry', () => {
      const legacyModels = ['gemma3-4b', 'gemma3:4b', 'gemma2-2b', 'gemma2:2b', 'gpt-4', 'claude-3'];
      for (const legacy of legacyModels) {
        const found = LOCAL_MODELS.find(m => m.model_id === legacy || m.ollama_name === legacy);
        assert.equal(found, undefined, `Legacy/external model ${legacy} must NOT exist in registry`);
      }
    });
  });
});
