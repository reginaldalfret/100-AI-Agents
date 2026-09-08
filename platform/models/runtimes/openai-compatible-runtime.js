import { ModelRuntime } from './base-runtime.js';

export class OpenAICompatibleRuntime extends ModelRuntime {
  constructor(endpoint = process.env.OPENAI_COMPATIBLE_ENDPOINT || 'http://127.0.0.1:8000/v1', apiKey = process.env.OPENAI_API_KEY || '') {
    super('openai-compatible');
    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.activeAborts = new Map();
  }

  async initialize() {
    try {
      const res = await fetch(`${this.endpoint}/models`, {
        headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
        signal: AbortSignal.timeout(2000)
      });
      this.initialized = res.ok;
      return this.initialized;
    } catch {
      this.initialized = false;
      return false;
    }
  }

  async generate(modelId, prompt, options = {}) {
    const startTime = Date.now();
    const messages = Array.isArray(prompt)
      ? prompt
      : [{ role: 'user', content: String(prompt) }];

    const id = options.id || options.requestId || crypto.randomUUID();
    const abortCtrl = new AbortController();
    this.activeAborts.set(id, abortCtrl);

    try {
      const res = await fetch(`${this.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {})
        },
        body: JSON.stringify({
          model: modelId,
          messages,
          stream: false,
          temperature: options.temperature,
          max_tokens: options.max_tokens
        }),
        signal: options.signal || abortCtrl.signal
      });

      if (!res.ok) {
        throw new Error(`OpenAI-compatible runtime error (${res.status}): ${res.statusText}`);
      }

      const data = await res.json();
      const choice = data.choices?.[0];
      const latencyMs = Date.now() - startTime;

      return {
        model_id: modelId,
        text: choice?.message?.content || '',
        finish_reason: choice?.finish_reason || 'stop',
        usage: data.usage,
        latency_ms: latencyMs,
        runtime: this.runtimeName
      };
    } finally {
      this.activeAborts.delete(id);
    }
  }

  async stream(modelId, prompt, callbacks = {}, options = {}) {
    const messages = Array.isArray(prompt)
      ? prompt
      : [{ role: 'user', content: String(prompt) }];

    const id = options.id || options.requestId || crypto.randomUUID();
    const abortCtrl = new AbortController();
    this.activeAborts.set(id, abortCtrl);

    try {
      const res = await fetch(`${this.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {})
        },
        body: JSON.stringify({
          model: modelId,
          messages,
          stream: true,
          temperature: options.temperature,
          max_tokens: options.max_tokens
        }),
        signal: options.signal || abortCtrl.signal
      });

      if (!res.ok) {
        throw new Error(`OpenAI-compatible stream error (${res.status}): ${res.statusText}`);
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
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;
          if (trimmed === 'data: [DONE]') {
            if (callbacks.onDone) callbacks.onDone({ type: 'done', model_id: modelId });
            continue;
          }
          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta && callbacks.onToken) {
                callbacks.onToken({
                  type: 'token',
                  model_id: modelId,
                  text: delta
                });
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      if (callbacks.onError) callbacks.onError({ type: 'error', model_id: modelId, error: err.message });
      else throw err;
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
    for (const [key, ctrl] of this.activeAborts.entries()) {
      ctrl.abort();
      this.activeAborts.delete(key);
    }
    return true;
  }

  async health() {
    return {
      healthy: await this.initialize(),
      runtime: this.runtimeName,
      endpoint: this.endpoint
    };
  }

  async status() {
    const h = await this.health();
    return h.healthy ? 'READY' : 'UNAVAILABLE';
  }

  metadata(modelId) {
    return {
      model_id: modelId,
      runtime: this.runtimeName,
      status: 'ready'
    };
  }

  async unload(modelId) {
    return true;
  }
}
