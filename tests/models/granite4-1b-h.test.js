import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LOCAL_MODELS, getModelById, ModelModality } from '../../platform/models/model-registry.js';
import { routeTaskToLocalModel } from '../../platform/models/model-router.js';
import { modelLifecycle, ModelLifecycleState } from '../../platform/models/model-lifecycle.js';

describe('IBM Granite 4 1B-H Model Test Suite', () => {
  describe('Registry Specification & Metadata', () => {
    it('verifies granite4-1b-h is registered in LOCAL_MODELS with correct enterprise properties', () => {
      const model = LOCAL_MODELS.find(m => m.model_id === 'granite4-1b-h');
      assert.ok(model, 'granite4-1b-h must be present in LOCAL_MODELS');
      assert.equal(model.model_id, 'granite4-1b-h');
      assert.equal(model.ollama_name, 'granite4:1b-h');
      assert.equal(model.name, 'IBM Granite 4 1B-H');
      assert.equal(model.provider, 'ollama');
      assert.equal(model.runtime, 'local-ollama');
      assert.equal(model.endpoint, 'http://127.0.0.1:11434');
      assert.equal(model.quantization, 'Q4_K_M');
      assert.equal(model.status, 'ready');
      assert.equal(model.priority, 3);
    });

    it('retrieves granite4-1b-h via getModelById helper', () => {
      const model = getModelById('granite4-1b-h');
      assert.ok(model, 'getModelById("granite4-1b-h") must return model spec');
      assert.equal(model.model_id, 'granite4-1b-h');
      assert.equal(model.ollama_name, 'granite4:1b-h');
    });

    it('verifies hardware budget and context length constraints', () => {
      const model = getModelById('granite4-1b-h');
      assert.ok(model.vram_mb <= 4096, `VRAM footprint (${model.vram_mb} MB) must fit within 4GB RTX 2050 bound`);
      assert.equal(model.vram_mb, 1200);
      assert.equal(model.ram_mb, 2048);
      assert.equal(model.context_length, 8192);
    });

    it('validates enterprise tool-calling, RAG, and classification capabilities', () => {
      const model = getModelById('granite4-1b-h');
      assert.ok(model.supported_modalities.includes(ModelModality.TEXT));
      assert.ok(model.capabilities.includes('enterprise-rag-tools'));
      assert.ok(model.capabilities.includes('structured-extraction'));
      assert.ok(model.capabilities.includes('classification'));
      assert.ok(model.capabilities.includes('tool-calling'));
      assert.ok(model.capabilities.includes('rag-synthesis'));
      assert.ok(model.recommended_tasks.includes('rag-document-search'));
      assert.ok(model.recommended_tasks.includes('entity-extraction'));
      assert.ok(model.recommended_tasks.includes('enterprise-workflows'));
      assert.ok(model.recommended_tasks.includes('tool-invocation'));
    });
  });

  describe('Routing & Inference Dispatch', () => {
    it('routes explicit model_override "granite4:1b-h" to granite4-1b-h', async () => {
      const res = await routeTaskToLocalModel({
        model_override: 'granite4:1b-h',
        prompt: 'Search RAG documents for ASME Section VIII compliance specs.'
      });
      assert.equal(res.selected_model, 'granite4-1b-h');
      assert.equal(res.model_name, 'IBM Granite 4 1B-H');
    });

    it('routes explicit model_override "granite4-1b-h" to granite4-1b-h', async () => {
      const res = await routeTaskToLocalModel({
        model_override: 'granite4-1b-h',
        prompt: 'Extract structured enterprise entities from document.'
      });
      assert.equal(res.selected_model, 'granite4-1b-h');
    });

    it('routes explicit model_override shorthand "granite" and "granite4" to granite4-1b-h', async () => {
      const resGranite = await routeTaskToLocalModel({
        model_override: 'granite',
        prompt: 'Execute tool invocation pipeline'
      });
      assert.equal(resGranite.selected_model, 'granite4-1b-h');

      const resGranite4 = await routeTaskToLocalModel({
        model_override: 'granite4',
        prompt: 'Execute tool invocation pipeline'
      });
      assert.equal(resGranite4.selected_model, 'granite4-1b-h');
    });

    it('routes modelMode "granite" to granite4-1b-h', async () => {
      const res = await routeTaskToLocalModel({
        modelMode: 'granite',
        prompt: 'Enterprise document classification task'
      });
      assert.equal(res.selected_model, 'granite4-1b-h');
      assert.equal(res.model_name, 'IBM Granite 4 1B-H');
    });

    it('verifies strict sovereign air-gapped guarantees for granite4-1b-h routing', async () => {
      const res = await routeTaskToLocalModel({
        model_override: 'granite4-1b-h',
        prompt: 'Synthesize RAG knowledge chunks'
      });
      assert.equal(res.external_calls, 0, 'Zero external calls required');
      assert.equal(res.is_air_gapped, true, 'Must operate strictly air-gapped');
      assert.equal(res.is_sovereign_local, true, 'Must be marked sovereign local');
      assert.deepEqual(res.hardware_footprint, {
        vram_mb: 1200,
        ram_mb: 2048,
        quantization: 'Q4_K_M'
      });
    });
  });

  describe('Lifecycle Management & VRAM Slot Allocation', () => {
    it('acquires and transitions model slot for granite4-1b-h', async () => {
      const slot = await modelLifecycle.acquireModelSlot('granite4-1b-h');
      assert.equal(slot.acquired, true);
      assert.equal(slot.model_id, 'granite4-1b-h');
      assert.equal(modelLifecycle.getModelState('granite4-1b-h'), ModelLifecycleState.ACTIVE);

      const trace = modelLifecycle.releaseModelSlot('granite4-1b-h', { duration_ms: 30, status: 'success' });
      assert.equal(trace.model_id, 'granite4-1b-h');
      assert.equal(trace.status, 'success');
      assert.equal(trace.is_air_gapped, true);
      assert.equal(modelLifecycle.getModelState('granite4-1b-h'), ModelLifecycleState.IDLE);
    });
  });
});
