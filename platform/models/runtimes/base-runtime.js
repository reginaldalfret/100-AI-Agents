/**
 * Unified ModelRuntime — Base Interface Contract
 * Standard lifecycle and inference interface for all local model execution engines.
 */

export class ModelRuntime {
  /**
   * @param {string} runtimeName Identifier for the runtime engine (e.g. 'ollama', 'transformers', 'personal-style')
   */
  constructor(runtimeName) {
    if (new.target === ModelRuntime) {
      throw new TypeError("Cannot construct ModelRuntime instances directly. Please extend.");
    }
    this.runtimeName = runtimeName;
    this.initialized = false;
  }

  /**
   * Initialize runtime resources, verify daemon health or warm weights.
   * @returns {Promise<boolean>}
   */
  async initialize() {
    throw new Error("initialize() must be implemented");
  }

  /**
   * Non-streaming generation returning normalized completion object.
   * @param {string} modelId Canonical model registry ID
   * @param {string|Array<{role: string, content: string}>} prompt Prompt string or chat messages array
   * @param {object} [options] Model parameters (temperature, max_tokens, signal, etc.)
   * @returns {Promise<{model_id: string, text: string, finish_reason?: string, usage?: object, latency_ms: number, runtime: string}>}
   */
  async generate(modelId, prompt, options = {}) {
    throw new Error("generate() must be implemented");
  }

  /**
   * Streaming generation yielding normalized SSE event objects.
   * @param {string} modelId Canonical model registry ID
   * @param {string|Array<{role: string, content: string}>} prompt Prompt string or chat messages array
   * @param {object} callbacks { onToken: (event) => void, onDone: (event) => void, onError: (err) => void }
   * @param {object} [options] Model parameters and AbortSignal
   * @returns {Promise<void>}
   */
  async stream(modelId, prompt, callbacks, options = {}) {
    throw new Error("stream() must be implemented");
  }

  /**
   * Stop/cancel active generation for a given task or session.
   * @param {string} [id] session_id or task_id to stop
   * @returns {Promise<boolean>}
   */
  async stop(id) {
    return true;
  }

  /**
   * Health and connectivity check.
   * @returns {Promise<{healthy: boolean, runtime: string, details?: object}>}
   */
  async health() {
    return { healthy: this.initialized, runtime: this.runtimeName };
  }

  /**
   * Current runtime status (e.g. 'READY', 'BUSY', 'UNLOADED').
   * @returns {Promise<string>}
   */
  async status() {
    return this.initialized ? 'READY' : 'UNLOADED';
  }

  /**
   * Retrieve normalized metadata for a model.
   * @param {string} modelId
   * @returns {object}
   */
  metadata(modelId) {
    return {
      model_id: modelId,
      runtime: this.runtimeName,
      status: 'ready'
    };
  }

  /**
   * Unload loaded models or release memory back to OS/GPU.
   * @param {string} [modelId]
   * @returns {Promise<boolean>}
   */
  async unload(modelId) {
    return true;
  }
}
