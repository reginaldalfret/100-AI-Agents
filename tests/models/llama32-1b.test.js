import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LOCAL_MODELS, getModelById, ModelModality } from '../../platform/models/model-registry.js';
import { routeTaskToLocalModel } from '../../platform/models/model-router.js';
import { modelLifecycle, ModelLifecycleState } from '../../platform/models/model-lifecycle.js';

describe('Meta Llama 3.2 1B Model Test Suite', () => {
  describe('Registry Specification & Metadata', () => {
    it('verifies llama3.2-1b is registered in LOCAL_MODELS with correct parameters', () => {
      const model = LOCAL_MODELS.find(m => m.model_id === 'llama3.2-1b');
      assert.ok(model, 'llama3.2-1b must be present in LOCAL_MODELS');
      assert.equal(model.model_id, 'llama3.2-1b');
      assert.equal(model.ollama_name, 'llama3.2:1b');
      assert.equal(model.name, 'Meta Llama 3.2 1B');
      assert.equal(model.provider, 'ollama');
      assert.equal(model.runtime, 'local-ollama');
      assert.equal(model.endpoint, 'http://127.0.0.1:11434');
      assert.equal(model.quantization, 'Q4_K_M');
      assert.equal(model.status, 'ready');
      assert.equal(model.priority, 3);
    });

    it('retrieves llama3.2-1b via getModelById helper', () => {
      const model = getModelById('llama3.2-1b');
      assert.ok(model, 'getModelById("llama3.2-1b") must return the model specification');
      assert.equal(model.model_id, 'llama3.2-1b');
      assert.equal(model.ollama_name, 'llama3.2:1b');
    });

    it('verifies hardware budget and context length constraints', () => {
      const model = getModelById('llama3.2-1b');
      assert.ok(model.vram_mb <= 4096, `VRAM footprint (${model.vram_mb} MB) must fit within 4GB RTX 2050 bound`);
      assert.equal(model.vram_mb, 1300);
      assert.equal(model.ram_mb, 2048);
      assert.equal(model.context_length, 8192);
    });

    it('validates supported modalities and capabilities for lightweight fast text tasks', () => {
      const model = getModelById('llama3.2-1b');
      assert.ok(model.supported_modalities.includes(ModelModality.TEXT));
      assert.ok(model.capabilities.includes('lightweight-general'));
      assert.ok(model.capabilities.includes('rewriting'));
      assert.ok(model.capabilities.includes('summarization'));
      assert.ok(model.capabilities.includes('simple-qa'));
      assert.ok(model.capabilities.includes('low-latency-text'));
      assert.ok(model.recommended_tasks.includes('general-assistant'));
      assert.ok(model.recommended_tasks.includes('text-rewriting'));
      assert.ok(model.recommended_tasks.includes('quick-summary'));
      assert.ok(model.recommended_tasks.includes('fast-response'));
    });
  });

  describe('Routing & Inference Dispatch', () => {
    it('routes explicit model_override "llama3.2:1b" to llama3.2-1b', async () => {
      const res = await routeTaskToLocalModel({
        model_override: 'llama3.2:1b',
        prompt: 'Provide a concise summary of the operating procedure.'
      });
      assert.equal(res.selected_model, 'llama3.2-1b');
      assert.equal(res.model_name, 'Meta Llama 3.2 1B');
    });

    it('routes explicit model_override "llama3.2-1b" to llama3.2-1b', async () => {
      const res = await routeTaskToLocalModel({
        model_override: 'llama3.2-1b',
        prompt: 'Rewrite this paragraph in active voice.'
      });
      assert.equal(res.selected_model, 'llama3.2-1b');
    });

    it('routes explicit model_override shorthand "llama" and "llama3" to llama3.2-1b', async () => {
      const resLlama = await routeTaskToLocalModel({
        model_override: 'llama',
        prompt: 'Fast question answering'
      });
      assert.equal(resLlama.selected_model, 'llama3.2-1b');

      const resLlama3 = await routeTaskToLocalModel({
        model_override: 'llama3',
        prompt: 'Fast question answering'
      });
      assert.equal(resLlama3.selected_model, 'llama3.2-1b');
    });

    it('routes modelMode "llama" to llama3.2-1b', async () => {
      const res = await routeTaskToLocalModel({
        modelMode: 'llama',
        prompt: 'Quick email draft'
      });
      assert.equal(res.selected_model, 'llama3.2-1b');
      assert.equal(res.model_name, 'Meta Llama 3.2 1B');
    });

    it('verifies strict sovereign air-gapped guarantees for llama3.2-1b routing', async () => {
      const res = await routeTaskToLocalModel({
        model_override: 'llama3.2-1b',
        prompt: 'Synthesize shift report'
      });
      assert.equal(res.external_calls, 0, 'Must require zero external calls');
      assert.equal(res.is_air_gapped, true, 'Must operate strictly air-gapped');
      assert.equal(res.is_sovereign_local, true, 'Must be marked sovereign local');
      assert.deepEqual(res.hardware_footprint, {
        vram_mb: 1300,
        ram_mb: 2048,
        quantization: 'Q4_K_M'
      });
    });
  });

  describe('Lifecycle Management & VRAM Slot Allocation', () => {
    it('acquires and transitions model slot for llama3.2-1b', async () => {
      const slot = await modelLifecycle.acquireModelSlot('llama3.2-1b');
      assert.equal(slot.acquired, true);
      assert.equal(slot.model_id, 'llama3.2-1b');
      assert.equal(modelLifecycle.getModelState('llama3.2-1b'), ModelLifecycleState.ACTIVE);

      const trace = modelLifecycle.releaseModelSlot('llama3.2-1b', { duration_ms: 25, status: 'success' });
      assert.equal(trace.model_id, 'llama3.2-1b');
      assert.equal(trace.status, 'success');
      assert.equal(trace.is_air_gapped, true);
      assert.equal(modelLifecycle.getModelState('llama3.2-1b'), ModelLifecycleState.IDLE);
    });
  });
});
