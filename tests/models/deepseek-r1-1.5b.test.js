import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LOCAL_MODELS, getModelById, ModelModality } from '../../platform/models/model-registry.js';
import { routeTaskToLocalModel } from '../../platform/models/model-router.js';
import { modelLifecycle, ModelLifecycleState } from '../../platform/models/model-lifecycle.js';

describe('DeepSeek-R1 1.5B Model Test Suite', () => {
  describe('Registry Specification & Metadata', () => {
    it('verifies deepseek-r1-1.5b is registered in LOCAL_MODELS with correct parameters', () => {
      const model = LOCAL_MODELS.find(m => m.model_id === 'deepseek-r1-1.5b');
      assert.ok(model, 'deepseek-r1-1.5b must be present in LOCAL_MODELS');
      assert.equal(model.model_id, 'deepseek-r1-1.5b');
      assert.equal(model.ollama_name, 'deepseek-r1:1.5b');
      assert.equal(model.name, 'DeepSeek-R1 1.5B (Reasoning Specialist)');
      assert.equal(model.provider, 'ollama');
      assert.equal(model.runtime, 'local-ollama');
      assert.equal(model.endpoint, 'http://127.0.0.1:11434');
      assert.equal(model.quantization, 'Q4_K_M');
      assert.equal(model.status, 'ready');
      assert.equal(model.priority, 2);
    });

    it('retrieves deepseek-r1-1.5b via getModelById helper', () => {
      const model = getModelById('deepseek-r1-1.5b');
      assert.ok(model, 'getModelById("deepseek-r1-1.5b") must return model spec');
      assert.equal(model.model_id, 'deepseek-r1-1.5b');
      assert.equal(model.ollama_name, 'deepseek-r1:1.5b');
    });

    it('verifies hardware budget and 128k context length', () => {
      const model = getModelById('deepseek-r1-1.5b');
      assert.ok(model.vram_mb <= 4096, `VRAM footprint (${model.vram_mb} MB) must fit within 4GB RTX 2050 bound`);
      assert.equal(model.vram_mb, 1200);
      assert.equal(model.ram_mb, 2048);
      assert.equal(model.context_length, 131072, 'DeepSeek-R1 must support 128k context length');
    });

    it('validates mathematics and step-by-step reasoning capabilities', () => {
      const model = getModelById('deepseek-r1-1.5b');
      assert.ok(model.supported_modalities.includes(ModelModality.TEXT));
      assert.ok(model.capabilities.includes('mathematics'));
      assert.ok(model.capabilities.includes('logical-reasoning'));
      assert.ok(model.capabilities.includes('step-by-step-reasoning'));
      assert.ok(model.capabilities.includes('analytical-questions'));
      assert.ok(model.capabilities.includes('chain-of-thought'));
      assert.ok(model.recommended_tasks.includes('math-calculation'));
      assert.ok(model.recommended_tasks.includes('logic-problem-solving'));
      assert.ok(model.recommended_tasks.includes('step-by-step-deduction'));
    });
  });

  describe('Routing & Inference Dispatch', () => {
    it('routes explicit model_override "deepseek-r1:1.5b" to deepseek-r1-1.5b', async () => {
      const res = await routeTaskToLocalModel({
        model_override: 'deepseek-r1:1.5b',
        prompt: 'Calculate 17 * 28 with step-by-step reasoning.'
      });
      assert.equal(res.selected_model, 'deepseek-r1-1.5b');
      assert.equal(res.model_name, 'DeepSeek-R1 1.5B (Reasoning Specialist)');
    });

    it('routes explicit model_override shorthand "deepseek" and "r1" to deepseek-r1-1.5b', async () => {
      const res1 = await routeTaskToLocalModel({
        model_override: 'deepseek',
        prompt: 'Solve logic puzzle.'
      });
      assert.equal(res1.selected_model, 'deepseek-r1-1.5b');

      const res2 = await routeTaskToLocalModel({
        model_override: 'r1',
        prompt: 'Solve logic puzzle.'
      });
      assert.equal(res2.selected_model, 'deepseek-r1-1.5b');
    });

    it('routes modelMode "deepseek" to deepseek-r1-1.5b', async () => {
      const res = await routeTaskToLocalModel({
        modelMode: 'deepseek',
        prompt: 'Explain why this algorithm works.'
      });
      assert.equal(res.selected_model, 'deepseek-r1-1.5b');
    });

    it('verifies strict sovereign air-gapped guarantees for deepseek-r1-1.5b routing', async () => {
      const res = await routeTaskToLocalModel({
        model_override: 'deepseek-r1:1.5b',
        prompt: 'Solve problem.'
      });
      assert.equal(res.is_air_gapped, true);
      assert.equal(res.external_calls, 0);
      assert.equal(res.is_sovereign_local, true);
      assert.deepEqual(res.hardware_footprint, {
        vram_mb: 1200,
        ram_mb: 2048,
        quantization: 'Q4_K_M'
      });
    });
  });

  describe('Lifecycle Management & VRAM Slot Allocation', () => {
    it('acquires and transitions model slot for deepseek-r1-1.5b', async () => {
      const slot = await modelLifecycle.acquireModelSlot('deepseek-r1-1.5b');
      assert.equal(slot.acquired, true);
      assert.equal(slot.model_id, 'deepseek-r1-1.5b');
      assert.equal(modelLifecycle.getModelState('deepseek-r1-1.5b'), ModelLifecycleState.ACTIVE);

      const trace = modelLifecycle.releaseModelSlot('deepseek-r1-1.5b', { duration_ms: 30, status: 'success' });
      assert.equal(trace.model_id, 'deepseek-r1-1.5b');
      assert.equal(trace.status, 'success');
      assert.equal(trace.is_air_gapped, true);
      assert.equal(modelLifecycle.getModelState('deepseek-r1-1.5b'), ModelLifecycleState.IDLE);
    });
  });
});
