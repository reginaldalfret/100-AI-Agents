import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LOCAL_MODELS, getModelById, ModelModality } from '../../platform/models/model-registry.js';
import { routeTaskToLocalModel } from '../../platform/models/model-router.js';
import { modelLifecycle, ModelLifecycleState } from '../../platform/models/model-lifecycle.js';

describe('SmolLM2 1.7B Model Test Suite', () => {
  describe('Registry Specification & Metadata', () => {
    it('verifies smollm2-1.7b is registered in LOCAL_MODELS with correct parameters', () => {
      const model = LOCAL_MODELS.find(m => m.model_id === 'smollm2-1.7b');
      assert.ok(model, 'smollm2-1.7b must be present in LOCAL_MODELS');
      assert.equal(model.model_id, 'smollm2-1.7b');
      assert.equal(model.ollama_name, 'smollm2:1.7b');
      assert.equal(model.name, 'SmolLM2 1.7B (Lightweight Text)');
      assert.equal(model.provider, 'Hugging Face');
      assert.equal(model.runtime, 'local-ollama');
      assert.equal(model.endpoint, 'http://127.0.0.1:11434');
      assert.equal(model.quantization, 'Q8_0');
      assert.equal(model.status, 'ready');
      assert.equal(model.priority, 2);
    });

    it('retrieves smollm2-1.7b via getModelById helper', () => {
      const model = getModelById('smollm2-1.7b');
      assert.ok(model, 'getModelById("smollm2-1.7b") must return model spec');
      assert.equal(model.model_id, 'smollm2-1.7b');
      assert.equal(model.ollama_name, 'smollm2:1.7b');
    });

    it('verifies hardware budget and context length constraints', () => {
      const model = getModelById('smollm2-1.7b');
      assert.ok(model.vram_mb <= 4096, `VRAM footprint (${model.vram_mb} MB) must fit within 4GB RTX 2050 bound`);
      assert.equal(model.vram_mb, 1800);
      assert.equal(model.ram_mb, 2048);
      assert.equal(model.context_length, 8192);
    });

    it('validates lightweight general text, rewriting, and summarization capabilities', () => {
      const model = getModelById('smollm2-1.7b');
      assert.ok(model.supported_modalities.includes(ModelModality.TEXT));
      assert.ok(model.capabilities.includes('general-text-generation'));
      assert.ok(model.capabilities.includes('rewriting'));
      assert.ok(model.capabilities.includes('summarization'));
      assert.ok(model.capabilities.includes('lightweight-qa'));
      assert.ok(model.capabilities.includes('simple-instruction-following'));
      assert.ok(model.recommended_tasks.includes('text-rewriting'));
      assert.ok(model.recommended_tasks.includes('concise-summarization'));
      assert.ok(model.recommended_tasks.includes('general-inquiries'));
    });
  });

  describe('Routing & Inference Dispatch', () => {
    it('routes explicit model_override "smollm2:1.7b" to smollm2-1.7b', async () => {
      const res = await routeTaskToLocalModel({
        model_override: 'smollm2:1.7b',
        prompt: 'Rewrite this paragraph professionally.'
      });
      assert.equal(res.selected_model, 'smollm2-1.7b');
      assert.equal(res.model_name, 'SmolLM2 1.7B (Lightweight Text)');
    });

    it('routes explicit model_override shorthand "smollm" and "smollm2" to smollm2-1.7b', async () => {
      const res1 = await routeTaskToLocalModel({
        model_override: 'smollm',
        prompt: 'Summarize this note.'
      });
      assert.equal(res1.selected_model, 'smollm2-1.7b');

      const res2 = await routeTaskToLocalModel({
        model_override: 'smollm2',
        prompt: 'Summarize this note.'
      });
      assert.equal(res2.selected_model, 'smollm2-1.7b');
    });

    it('routes modelMode "smollm2" to smollm2-1.7b', async () => {
      const res = await routeTaskToLocalModel({
        modelMode: 'smollm2',
        prompt: 'Explain what RAG is in three points.'
      });
      assert.equal(res.selected_model, 'smollm2-1.7b');
    });

    it('verifies strict sovereign air-gapped guarantees for smollm2-1.7b routing', async () => {
      const res = await routeTaskToLocalModel({
        model_override: 'smollm2:1.7b',
        prompt: 'General question.'
      });
      assert.equal(res.is_air_gapped, true);
      assert.equal(res.external_calls, 0);
      assert.equal(res.is_sovereign_local, true);
      assert.deepEqual(res.hardware_footprint, {
        vram_mb: 1800,
        ram_mb: 2048,
        quantization: 'Q8_0'
      });
    });
  });

  describe('Lifecycle Management & VRAM Slot Allocation', () => {
    it('acquires and transitions model slot for smollm2-1.7b', async () => {
      const slot = await modelLifecycle.acquireModelSlot('smollm2-1.7b');
      assert.equal(slot.acquired, true);
      assert.equal(slot.model_id, 'smollm2-1.7b');
      assert.equal(modelLifecycle.getModelState('smollm2-1.7b'), ModelLifecycleState.ACTIVE);

      const trace = modelLifecycle.releaseModelSlot('smollm2-1.7b', { duration_ms: 25, status: 'success' });
      assert.equal(trace.model_id, 'smollm2-1.7b');
      assert.equal(trace.status, 'success');
      assert.equal(trace.is_air_gapped, true);
      assert.equal(modelLifecycle.getModelState('smollm2-1.7b'), ModelLifecycleState.IDLE);
    });
  });
});
