import { ModelRuntime } from './base-runtime.js';
import { getModelById } from '../model-registry.js';

export class OllamaRuntime extends ModelRuntime {
  constructor(endpoint = process.env.OLLAMA_ENDPOINT || 'http://127.0.0.1:11434') {
    super('ollama');
    this.endpoint = endpoint;
    this.activeAborts = new Map();
  }

  async initialize() {
    try {
      const res = await fetch(`${this.endpoint}/api/tags`, { signal: AbortSignal.timeout(3000) });
      this.initialized = res.ok;
      return this.initialized;
    } catch {
      this.initialized = false;
      return false;
    }
  }

  async generate(modelId, prompt, options = {}) {
    const startTime = Date.now();
    const modelEntry = getModelById(modelId);
    const ollamaModel = modelEntry?.ollama_name || modelId;

    const formattedPrompt = Array.isArray(prompt)
      ? prompt.map(m => `${m.role}: ${m.content}`).join('\n')
      : String(prompt);

    const abortCtrl = new AbortController();
    const id = options.id || options.requestId || crypto.randomUUID();
    this.activeAborts.set(id, abortCtrl);

    try {
      const signal = options.signal || abortCtrl.signal;
      const res = await fetch(`${this.endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ollamaModel,
          prompt: formattedPrompt,
          stream: false,
          options: {
            temperature: options.temperature,
            top_p: options.top_p,
            num_predict: options.max_tokens
          }
        }),
        signal
      });

      if (!res.ok) {
        throw new Error(`Ollama API error (${res.status}): ${res.statusText}`);
      }

      const data = await res.json();
      const latencyMs = Date.now() - startTime;

      return {
        model_id: modelId,
        text: data.response || '',
        finish_reason: data.done_reason || 'stop',
        usage: data.eval_count ? {
          prompt_tokens: data.prompt_eval_count || 0,
          completion_tokens: data.eval_count || 0,
          total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
        } : undefined,
        latency_ms: latencyMs,
        runtime: this.runtimeName
      };
    } finally {
      this.activeAborts.delete(id);
    }
  }

  async stream(modelId, prompt, callbacks = {}, options = {}) {
    const modelEntry = getModelById(modelId);
    const ollamaModel = modelEntry?.ollama_name || modelId;

    const formattedPrompt = Array.isArray(prompt)
      ? prompt.map(m => `${m.role}: ${m.content}`).join('\n')
      : String(prompt);

    const abortCtrl = new AbortController();
    const id = options.id || options.requestId || crypto.randomUUID();
    this.activeAborts.set(id, abortCtrl);

    try {
      const signal = options.signal || abortCtrl.signal;
      const res = await fetch(`${this.endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ollamaModel,
          prompt: formattedPrompt,
          stream: true,
          options: {
            temperature: options.temperature,
            top_p: options.top_p,
            num_predict: options.max_tokens
          }
        }),
        signal
      });

      if (!res.ok) {
        throw new Error(`Ollama API error (${res.status}): ${res.statusText}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.response && callbacks.onToken) {
              callbacks.onToken({
                type: 'token',
                model_id: modelId,
                text: parsed.response
              });
            }
            if (parsed.done && callbacks.onDone) {
              callbacks.onDone({
                type: 'done',
                model_id: modelId,
                eval_count: parsed.eval_count,
                eval_duration: parsed.eval_duration
              });
            }
          } catch {}
        }
      }
    } catch (err) {
      if (callbacks.onError) {
        callbacks.onError({
          type: 'error',
          model_id: modelId,
          error: err.message
        });
      } else {
        throw err;
      }
    } finally {
      this.activeAborts.delete(id);
    }
  }

  async stop(id) {
    if (id && this.activeAborts.has(id)) {
      this.activeAborts.get(id).abort();
      this.activeAborts.delete(id);
      return true;
    }
    // If no specific id provided, abort all active generations
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
      parameter_count: model?.parameter_count || model?.vram_mb ? `${model.vram_mb}MB` : 'unknown',
      quantization: model?.quantization || 'unknown',
      capabilities: model?.capabilities || ['general-reasoning'],
      local: true,
      status: 'ready'
    };
  }

  async unload(modelId) {
    // Ollama frees VRAM after keep_alive expires or when requested with keep_alive: 0
    try {
      const modelEntry = getModelById(modelId);
      const ollamaModel = modelEntry?.ollama_name || modelId;
      await fetch(`${this.endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: ollamaModel, keep_alive: 0 })
      });
      return true;
    } catch {
      return false;
    }
  }
}
