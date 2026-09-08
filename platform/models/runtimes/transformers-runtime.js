import { ModelRuntime } from './base-runtime.js';
import { getModelById } from '../model-registry.js';

export class TransformersRuntime extends ModelRuntime {
  constructor(endpoint = process.env.TRANSFORMERS_PEFT_URL || 'http://127.0.0.1:8305') {
    super('transformers');
    this.endpoint = endpoint;
    this.activeAborts = new Map();
  }

  async initialize() {
    try {
      const res = await fetch(`${this.endpoint}/health`, { signal: AbortSignal.timeout(2000) });
      this.initialized = res.ok;
      return this.initialized;
    } catch {
      // Fallback check on base port
      try {
        const res = await fetch(`${this.endpoint}/v1/models`, { signal: AbortSignal.timeout(2000) });
        this.initialized = res.ok;
        return this.initialized;
      } catch {
        this.initialized = false;
        return false;
      }
    }
  }

  async generate(modelId, prompt, options = {}) {
    const startTime = Date.now();
    const formattedPrompt = Array.isArray(prompt)
      ? prompt.map(m => `${m.role}: ${m.content}`).join('\n')
      : String(prompt);

    const abortCtrl = new AbortController();
    const id = options.id || options.requestId || crypto.randomUUID();
    this.activeAborts.set(id, abortCtrl);

    try {
      const signal = options.signal || abortCtrl.signal;
      const res = await fetch(`${this.endpoint}/v1/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_id: modelId,
          prompt: formattedPrompt,
          max_tokens: options.max_tokens || 256,
          stream: false
        }),
        signal
      });

      if (!res.ok) {
        throw new Error(`Transformers PEFT API error (${res.status}): ${res.statusText}`);
      }

      const data = await res.json();
      const latencyMs = Date.now() - startTime;

      return {
        model_id: modelId,
        text: data.text || data.response || '',
        finish_reason: data.finish_reason || 'stop',
        usage: data.tokens ? {
          completion_tokens: data.tokens,
          total_tokens: data.tokens
        } : undefined,
        latency_ms: latencyMs,
        runtime: this.runtimeName
      };
    } finally {
      this.activeAborts.delete(id);
    }
  }

  async stream(modelId, prompt, callbacks = {}, options = {}) {
    // Transformers PEFT endpoint provides atomic batch generation or simulated streaming
    const result = await this.generate(modelId, prompt, options);
    if (callbacks.onToken) {
      callbacks.onToken({
        type: 'token',
        model_id: modelId,
        text: result.text
      });
    }
    if (callbacks.onDone) {
      callbacks.onDone({
        type: 'done',
        model_id: modelId
      });
    }
  }

  async stop(id) {
    if (id && this.activeAborts.has(id)) {
      this.activeAborts.get(id).abort();
      this.activeAborts.delete(id);
      return true;
    }
    for (const [key, ctrl] of this.activeAborts.entries()) {
      ctrl.abort();
      this.activeAborts.delete(key);
    }
    return true;
  }

  async health() {
    const isHealthy = await this.initialize();
    return {
      healthy: isHealthy,
      runtime: this.runtimeName,
      endpoint: this.endpoint
    };
  }

  async status() {
    const h = await this.health();
    return h.healthy ? 'READY' : 'UNAVAILABLE';
  }

  metadata(modelId) {
    const model = getModelById(modelId);
    return {
      model_id: modelId,
      display_name: model?.name || modelId,
      runtime: this.runtimeName,
      quantization: model?.quantization || '4bit-QLoRA',
      capabilities: ['personal-style-generation', 'peft-lora-adapter'],
      local: true,
      status: 'ready'
    };
  }

  async unload(modelId) {
    return true;
  }
}
