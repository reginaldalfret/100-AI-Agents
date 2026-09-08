import { getModelById, RuntimeType } from '../model-registry.js';
import { OllamaRuntime } from './ollama-runtime.js';
import { TransformersRuntime } from './transformers-runtime.js';
import { PersonalStyleRuntime } from './personal-style-runtime.js';
import { OpenAICompatibleRuntime } from './openai-compatible-runtime.js';

export class RuntimeRouter {
  constructor() {
    this.ollama = new OllamaRuntime();
    this.transformers = new TransformersRuntime();
    this.personalStyle = new PersonalStyleRuntime();
    this.openaiCompatible = new OpenAICompatibleRuntime();

    this.runtimes = {
      ollama: this.ollama,
      transformers: this.transformers,
      'personal-style': this.personalStyle,
      'openai-compatible': this.openaiCompatible
    };
  }

  /**
   * Resolve appropriate ModelRuntime instance for a canonical model ID.
   * @param {string} modelId
   * @returns {import('./base-runtime.js').ModelRuntime}
   */
  resolveRuntime(modelId) {
    if (!modelId) return this.ollama;

    // Check for personal style models
    if (modelId === '301-gemma-kaviya-style-v1' || modelId.includes('personal-style') || modelId.includes('kaviya')) {
      return this.personalStyle;
    }

    const model = getModelById(modelId);
    if (!model) {
      // If not found in registry, default to Ollama for local fallback
      return this.ollama;
    }

    switch (model.runtime_type) {
      case RuntimeType.PYTORCH:
        return this.transformers;
      case RuntimeType.OLLAMA:
      default:
        return this.ollama;
    }
  }

  /**
   * Standardized generation routing.
   */
  async generate(modelId, prompt, options = {}) {
    const runtime = this.resolveRuntime(modelId);
    return await runtime.generate(modelId, prompt, options);
  }

  /**
   * Standardized stream routing.
   */
  async stream(modelId, prompt, callbacks, options = {}) {
    const runtime = this.resolveRuntime(modelId);
    return await runtime.stream(modelId, prompt, callbacks, options);
  }

  /**
   * Stop active generation across all or specific runtime.
   */
  async stop(id) {
    const results = await Promise.all(
      Object.values(this.runtimes).map(r => r.stop(id).catch(() => false))
    );
    return results.some(Boolean);
  }

  /**
   * Aggregate health across all runtimes.
   */
  async health() {
    const healthMap = {};
    for (const [name, runtime] of Object.entries(this.runtimes)) {
      try {
        healthMap[name] = await runtime.health();
      } catch (err) {
        healthMap[name] = { healthy: false, error: err.message };
      }
    }
    return healthMap;
  }

  /**
   * Standard metadata retrieval.
   */
  metadata(modelId) {
    const runtime = this.resolveRuntime(modelId);
    return runtime.metadata(modelId);
  }
}

export const runtimeRouter = new RuntimeRouter();
