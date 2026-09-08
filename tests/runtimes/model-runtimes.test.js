import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ModelRuntime,
  OllamaRuntime,
  TransformersRuntime,
  PersonalStyleRuntime,
  OpenAICompatibleRuntime,
  runtimeRouter
} from '../../platform/models/runtimes/index.js';

describe('Unified ModelRuntime Interface & Adapters', () => {
  it('ModelRuntime base class throws when instantiated directly', () => {
    assert.throws(() => new ModelRuntime('test'), /Cannot construct ModelRuntime/);
  });

  describe('OllamaRuntime', () => {
    const ollama = new OllamaRuntime();

    it('inherits from ModelRuntime with runtime name ollama', () => {
      assert.ok(ollama instanceof ModelRuntime);
      assert.equal(ollama.runtimeName, 'ollama');
    });

    it('implements metadata with standardized structure', () => {
      const meta = ollama.metadata('nemotron-3-nano');
      assert.equal(meta.model_id, 'nemotron-3-nano');
      assert.equal(meta.runtime, 'ollama');
      assert.equal(meta.local, true);
      assert.ok(meta.display_name);
    });

    it('implements health and status check', async () => {
      const h = await ollama.health();
      assert.ok('healthy' in h);
      assert.equal(h.runtime, 'ollama');
      const s = await ollama.status();
      assert.ok(s === 'READY' || s === 'UNAVAILABLE');
    });
  });

  describe('TransformersRuntime', () => {
    const transformers = new TransformersRuntime();

    it('inherits from ModelRuntime with runtime name transformers', () => {
      assert.ok(transformers instanceof ModelRuntime);
      assert.equal(transformers.runtimeName, 'transformers');
    });

    it('implements metadata with standardized structure', () => {
      const meta = transformers.metadata('301-gemma-kaviya-style-v1');
      assert.equal(meta.model_id, '301-gemma-kaviya-style-v1');
      assert.equal(meta.runtime, 'transformers');
      assert.equal(meta.local, true);
    });
  });

  describe('PersonalStyleRuntime', () => {
    const personal = new PersonalStyleRuntime();

    it('inherits from ModelRuntime with runtime name personal-style', () => {
      assert.ok(personal instanceof ModelRuntime);
      assert.equal(personal.runtimeName, 'personal-style');
    });

    it('implements metadata for personal style model', () => {
      const meta = personal.metadata('301-gemma-kaviya-style-v1');
      assert.ok(meta.display_name.includes('Kaviya'));
      assert.equal(meta.runtime, 'personal-style');
    });
  });

  describe('OpenAICompatibleRuntime', () => {
    const oai = new OpenAICompatibleRuntime();

    it('inherits from ModelRuntime with runtime name openai-compatible', () => {
      assert.ok(oai instanceof ModelRuntime);
      assert.equal(oai.runtimeName, 'openai-compatible');
    });
  });

  describe('RuntimeRouter Resolution', () => {
    it('routes Ollama model nemotron-3-nano to OllamaRuntime', () => {
      const runtime = runtimeRouter.resolveRuntime('nemotron-3-nano');
      assert.ok(runtime instanceof OllamaRuntime);
      assert.equal(runtime.runtimeName, 'ollama');
    });

    it('routes gemma3-1b to OllamaRuntime', () => {
      const runtime = runtimeRouter.resolveRuntime('gemma3-1b');
      assert.ok(runtime instanceof OllamaRuntime);
      assert.equal(runtime.runtimeName, 'ollama');
    });

    it('routes 301-gemma-kaviya-style-v1 to PersonalStyleRuntime', () => {
      const runtime = runtimeRouter.resolveRuntime('301-gemma-kaviya-style-v1');
      assert.ok(runtime instanceof PersonalStyleRuntime);
      assert.equal(runtime.runtimeName, 'personal-style');
    });

    it('returns standardized metadata via router', () => {
      const meta = runtimeRouter.metadata('nemotron-3-nano');
      assert.equal(meta.model_id, 'nemotron-3-nano');
      assert.equal(meta.runtime, 'ollama');
    });
  });
});
