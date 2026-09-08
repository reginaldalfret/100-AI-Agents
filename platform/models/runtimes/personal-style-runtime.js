import { ModelRuntime } from './base-runtime.js';
import { personalStyleGemmaRuntime } from '../../personal-style/gemma-runtime.js';

export class PersonalStyleRuntime extends ModelRuntime {
  constructor() {
    super('personal-style');
  }

  async initialize() {
    try {
      const res = await personalStyleGemmaRuntime.initialize();
      this.initialized = res.status === 'ready' || res.status === 'already_ready';
      return true;
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

    const result = await personalStyleGemmaRuntime.generate({
      messages,
      session_id: options.session_id,
      model: modelId,
      isBase: Boolean(options.is_base)
    });

    const latencyMs = Date.now() - startTime;

    return {
      model_id: modelId,
      text: result.response || '',
      finish_reason: 'stop',
      usage: result.usage,
      latency_ms: latencyMs,
      runtime: this.runtimeName
    };
  }

  async stream(modelId, prompt, callbacks = {}, options = {}) {
    const messages = Array.isArray(prompt)
      ? prompt
      : [{ role: 'user', content: String(prompt) }];

    await personalStyleGemmaRuntime.stream_generate({
      messages,
      session_id: options.session_id,
      model: modelId,
      isBase: Boolean(options.is_base),
      onToken: (token) => {
        if (callbacks.onToken) {
          callbacks.onToken({
            type: 'token',
            model_id: modelId,
            text: token
          });
        }
      },
      onDone: ({ fullText, session_id }) => {
        if (callbacks.onDone) {
          callbacks.onDone({
            type: 'done',
            model_id: modelId,
            session_id
          });
        }
      },
      onError: (err) => {
        if (callbacks.onError) {
          callbacks.onError({
            type: 'error',
            model_id: modelId,
            error: err.message
          });
        }
      }
    });
  }

  async stop(id) {
    personalStyleGemmaRuntime.stop(id);
    return true;
  }

  async health() {
    const st = personalStyleGemmaRuntime.status();
    return {
      healthy: st.healthy || st.state === 'READY' || st.state === 'INITIALIZING',
      runtime: this.runtimeName,
      details: st
    };
  }

  async status() {
    const st = personalStyleGemmaRuntime.status();
    return st.state || 'READY';
  }

  metadata(modelId) {
    return {
      model_id: modelId,
      display_name: 'Gemma 3 1B — Kaviya Personal Style',
      runtime: this.runtimeName,
      parameter_count: '1B (LoRA Adapter: 16-rank)',
      quantization: '4bit-QLoRA',
      capabilities: ['kaviya-personal-style', 'whatsapp-vernacular-synthesis'],
      local: true,
      status: 'ready'
    };
  }

  async unload(modelId) {
    return true;
  }
}
