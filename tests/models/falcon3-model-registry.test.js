import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getModelById, LOCAL_MODELS, isCpuModel } from '../../platform/models/model-registry.js';

describe('Falcon3 1B — Model Registry Specification', () => {
  it('retrieves Falcon3 1B via exact ID and aliases', () => {
    const byId = getModelById('falcon3-1b-instruct');
    const byTag = getModelById('falcon3:1b-instruct-q4_K_M');
    const byAlias = getModelById('falcon3');
    const byName = getModelById('Falcon3 1B');

    assert.ok(byId, 'Must resolve by model_id');
    assert.strictEqual(byId.model_id, 'falcon3-1b-instruct');
    assert.strictEqual(byTag.model_id, 'falcon3-1b-instruct');
    assert.strictEqual(byAlias.model_id, 'falcon3-1b-instruct');
    assert.strictEqual(byName.model_id, 'falcon3-1b-instruct');
  });

  it('declares execution_target as GPU and is NOT classified as CPU model', () => {
    const model = getModelById('falcon3-1b-instruct');
    assert.strictEqual(model.execution_target, 'GPU');
    assert.strictEqual(isCpuModel('falcon3-1b-instruct'), false);
    assert.strictEqual(isCpuModel('falcon3'), false);
  });

  it('validates provider is Technology Innovation Institute and badge is SCIENCE', () => {
    const model = getModelById('falcon3-1b-instruct');
    assert.strictEqual(model.provider, 'Technology Innovation Institute');
    assert.strictEqual(model.badge, 'SCIENCE');
    assert.strictEqual(model.primaryTag, 'SCIENCE');
    assert.ok(model.capabilities.includes('science'));
    assert.ok(model.capabilities.includes('mathematics'));
    assert.ok(model.capabilities.includes('coding'));
  });
});
