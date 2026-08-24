import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LOCAL_MODELS, getModelById, ModelModality } from '../../platform/models/model-registry.js';
import { routeTaskToLocalModel } from '../../platform/models/model-router.js';
import { modelLifecycle, ModelLifecycleState } from '../../platform/models/model-lifecycle.js';

describe('Microsoft Phi-4 Mini Model Test Suite', () => {
  describe('Registry Specification & Metadata', () => {
    it('verifies phi4-mini is registered in LOCAL_MODELS with correct mathematical reasoning properties', () => {
      const model = LOCAL_MODELS.find(m => m.model_id === 'phi4-mini');
      assert.ok(model, 'phi4-mini must be present in LOCAL_MODELS');
      assert.equal(model.model_id, 'phi4-mini');
      assert.equal(model.ollama_name, 'phi4-mini');
      assert.equal(model.name, 'Microsoft Phi-4 Mini');
      assert.equal(model.provider, 'ollama');
      assert.equal(model.runtime, 'local-ollama');
      assert.equal(model.endpoint, 'http://127.0.0.1:11434');
      assert.equal(model.quantization, 'Q4_K_M');
      assert.equal(model.status, 'ready');
      assert.equal(model.priority, 2);
    });

    it('retrieves phi4-mini via getModelById helper', () => {
      const model = getModelById('phi4-mini');
      assert.ok(model, 'getModelById("phi4-mini") must return model spec');
      assert.equal(model.model_id, 'phi4-mini');
      assert.equal(model.ollama_name, 'phi4-mini');
    });

    it('verifies hardware budget and deep 16k context length', () => {
      const model = getModelById('phi4-mini');
      assert.ok(model.vram_mb <= 4096, `VRAM footprint (${model.vram_mb} MB) must fit within 4GB RTX 2050 bound`);
      assert.equal(model.vram_mb, 2400);
      assert.equal(model.ram_mb, 4096);
      assert.equal(model.context_length, 16384, 'Phi-4 Mini must support 16k context window');
    });

    it('validates mathematics, logical deduction, and algorithmic planning capabilities', () => {
      const model = getModelById('phi4-mini');
      assert.ok(model.supported_modalities.includes(ModelModality.TEXT));
      assert.ok(model.capabilities.includes('reasoning-math'));
      assert.ok(model.capabilities.includes('logical-deduction'));
      assert.ok(model.capabilities.includes('mathematics'));
      assert.ok(model.capabilities.includes('algorithmic-problem-solving'));
      assert.ok(model.capabilities.includes('planning'));
      assert.ok(model.recommended_tasks.includes('mathematical-calculations'));
      assert.ok(model.recommended_tasks.includes('logical-puzzles'));
      assert.ok(model.recommended_tasks.includes('algorithmic-planning'));
      assert.ok(model.recommended_tasks.includes('analytical-reasoning'));
    });
  });

  describe('Routing & Inference Dispatch', () => {
    it('routes explicit model_override "phi4-mini" to phi4-mini', async () => {
      const res = await routeTaskToLocalModel({
        model_override: 'phi4-mini',
        prompt: 'Calculate hydrodynamic pressure drop across heat exchanger tubes.'
      });
      assert.equal(res.selected_model, 'phi4-mini');
      assert.equal(res.model_name, 'Microsoft Phi-4 Mini');
    });

    it('routes explicit model_override shorthand "phi" and "phi4" to phi4-mini', async () => {
      const resPhi = await routeTaskToLocalModel({
        model_override: 'phi',
        prompt: 'Solve algorithmic constraint optimization problem'
      });
      assert.equal(resPhi.selected_model, 'phi4-mini');

      const resPhi4 = await routeTaskToLocalModel({
        model_override: 'phi4',
        prompt: 'Solve algorithmic constraint optimization problem'
      });
      assert.equal(resPhi4.selected_model, 'phi4-mini');
    });

    it('routes modelMode "phi" to phi4-mini', async () => {
      const res = await routeTaskToLocalModel({
        modelMode: 'phi',
        prompt: 'Perform logical deduction on failure mode causality tree'
      });
      assert.equal(res.selected_model, 'phi4-mini');
      assert.equal(res.model_name, 'Microsoft Phi-4 Mini');
    });

    it('verifies strict sovereign air-gapped guarantees for phi4-mini routing', async () => {
      const res = await routeTaskToLocalModel({
        model_override: 'phi4-mini',
        prompt: 'Calculate pipe wall thickness loss rate'
      });
      assert.equal(res.external_calls, 0, 'Zero external calls required');
      assert.equal(res.is_air_gapped, true, 'Must operate strictly air-gapped');
      assert.equal(res.is_sovereign_local, true, 'Must be marked sovereign local');
      assert.deepEqual(res.hardware_footprint, {
        vram_mb: 2400,
        ram_mb: 4096,
        quantization: 'Q4_K_M'
      });
    });
  });

  describe('Lifecycle Management & VRAM Slot Allocation', () => {
    it('acquires and transitions model slot for phi4-mini', async () => {
      const slot = await modelLifecycle.acquireModelSlot('phi4-mini');
      assert.equal(slot.acquired, true);
      assert.equal(slot.model_id, 'phi4-mini');
      assert.equal(modelLifecycle.getModelState('phi4-mini'), ModelLifecycleState.ACTIVE);

      const trace = modelLifecycle.releaseModelSlot('phi4-mini', { duration_ms: 40, status: 'success' });
      assert.equal(trace.model_id, 'phi4-mini');
      assert.equal(trace.status, 'success');
      assert.equal(trace.is_air_gapped, true);
      assert.equal(modelLifecycle.getModelState('phi4-mini'), ModelLifecycleState.IDLE);
    });
  });
});
