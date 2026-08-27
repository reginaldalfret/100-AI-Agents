import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getModelById } from '../../platform/models/model-registry.js';
import { runLocalModel } from '../../platform/models/model-streamer.js';

describe('Falcon3 1B — GPU Registry & Real Inference', () => {
  it('Registration and GPU metadata validation', () => {
    const model = getModelById('falcon3-1b-instruct');
    assert.ok(model, 'Falcon3 1B must be registered in LOCAL_MODELS');
    assert.strictEqual(model.name, 'Falcon3 1B');
    assert.strictEqual(model.provider, 'Technology Innovation Institute');
    assert.strictEqual(model.ollama_name, 'falcon3:1b-instruct-q4_K_M');
    assert.strictEqual(model.execution_target, 'GPU');
    assert.strictEqual(model.badge, 'SCIENCE');
    assert.strictEqual(model.primaryTag, 'SCIENCE');
    assert.strictEqual(model.quantization, 'Q4_K_M');
    assert.strictEqual(model.context_length, 8192);
    assert.ok(model.vram_mb > 0, 'GPU model must declare positive VRAM');
  });

  it('Real GPU inference execution with verified sovereignty', async () => {
    const result = await runLocalModel({
      model: 'falcon3-1b-instruct',
      prompt: 'What is 2 + 2?',
      options: {
        max_tokens: 30,
        temperature: 0.1
      }
    });

    assert.ok(result, 'Result must be returned');
    assert.ok(result.text && result.text.length > 0, 'Text output must be non-empty');
    assert.strictEqual(result.external_calls, 0, 'External calls must be strictly 0');
    assert.strictEqual(result.is_air_gapped, true, 'Must be air-gapped');
    assert.ok(result.text.includes('4'), 'Must correctly solve 2 + 2 = 4');
  });
});
