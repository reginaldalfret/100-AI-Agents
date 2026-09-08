import { getModelById, LOCAL_MODELS, RuntimeType } from '../models/model-registry.js';

export const DEFAULT_ARENA_MODELS = [
  'nemotron-3-nano',
  'gemma3-1b',
  'local-code-specialist',
  'llama3.2-1b',
  'granite4-1b-h',
  'phi4-mini',
  'smollm2-1.7b',
  'falcon3-1b-instruct'
];

/**
 * Adapter interface for model generation.
 */
class ModelArenaAdapter {
    /**
     * @param {Object} modelEntry 
     * @param {string} prompt 
     * @param {Object} options 
     * @param {Function} onToken Callback for streaming tokens
     * @returns {Promise<{text: string, tokens: number, timeMs: number, tokPerSec: number}>}
     */
    async generate(modelEntry, prompt, options = {}, onToken = null) {
        throw new Error('Not implemented');
    }
}

class OllamaAdapter extends ModelArenaAdapter {
    async generate(modelEntry, prompt, options = {}, onToken = null) {
        const url = 'http://127.0.0.1:11434/api/generate';
        const startTime = Date.now();
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: modelEntry.ollama_name || modelEntry.model_id,
                prompt: prompt,
                stream: true,
                ...options
            }),
            signal: options.signal
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let tokens = 0;
        let timeMs = 0;
        let tokPerSec = 0;
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
                    if (parsed.response) {
                        fullText += parsed.response;
                        tokens++;
                        if (onToken) {
                            onToken(parsed.response);
                        }
                    }
                    if (parsed.done) {
                        timeMs = Date.now() - startTime;
                        if (parsed.eval_count && parsed.eval_duration) {
                            tokPerSec = parsed.eval_count / (parsed.eval_duration / 1e9);
                            tokens = parsed.eval_count;
                        } else {
                            tokPerSec = (tokens / timeMs) * 1000;
                        }
                    }
                } catch (e) {
                    console.error("Error parsing Ollama JSON chunk:", e, line);
                }
            }
        }
        
        if (buffer.trim()) {
            try {
                const parsed = JSON.parse(buffer);
                if (parsed.response) {
                    fullText += parsed.response;
                    tokens++;
                    if (onToken) onToken(parsed.response);
                }
                if (parsed.done) {
                    timeMs = Date.now() - startTime;
                    if (parsed.eval_count && parsed.eval_duration) {
                        tokPerSec = parsed.eval_count / (parsed.eval_duration / 1e9);
                        tokens = parsed.eval_count;
                    }
                }
            } catch (e) {}
        }

        if (timeMs === 0) timeMs = Date.now() - startTime;
        if (tokPerSec === 0 && timeMs > 0) tokPerSec = (tokens / timeMs) * 1000;

        return { text: fullText, tokens, timeMs, tokPerSec };
    }
}

class TransformersPEFTAdapter extends ModelArenaAdapter {
    async generate(modelEntry, prompt, options = {}, onToken = null) {
        const url = 'http://127.0.0.1:8305/v1/generate';
        const startTime = Date.now();
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                model_id: modelEntry.model_id,
                max_tokens: 256,
                stream: false,
                ...options
            }),
            signal: options.signal
        });

        if (!response.ok) {
            throw new Error(`Transformers PEFT API error: ${response.statusText}`);
        }

        const data = await response.json();
        const timeMs = Date.now() - startTime;
        const text = data.text || data.response || '';
        
        const tokens = data.tokens || text.split(/\\s+/).length;
        const tokPerSec = data.tokPerSec || ((tokens / timeMs) * 1000);
        
        if (onToken && text) {
            onToken(text);
        }

        return { text, tokens, timeMs, tokPerSec };
    }
}

export class ModelArenaService {
    constructor() {
        this.queue = [];
        this.results = new Map();
        this.activeComparison = null;
        this.isGenerating = false;
        this.abortController = null;
        this.listeners = new Map();
        
        this.adapters = {
            [RuntimeType?.OLLAMA || 'OLLAMA']: new OllamaAdapter(),
            [RuntimeType?.TRANSFORMERS_PEFT || 'TRANSFORMERS_PEFT']: new TransformersPEFTAdapter()
        };
        // Fallback matching if RuntimeType values differ
        this.ollamaAdapter = new OllamaAdapter();
        this.peftAdapter = new TransformersPEFTAdapter();
    }

    /**
     * @param {string} comparisonId 
     * @param {Function} callback 
     */
    subscribe(comparisonId, callback) {
        if (!this.listeners.has(comparisonId)) {
            this.listeners.set(comparisonId, new Set());
        }
        this.listeners.get(comparisonId).add(callback);
    }

    /**
     * @param {string} comparisonId 
     * @param {Function} callback 
     */
    unsubscribe(comparisonId, callback) {
        if (this.listeners.has(comparisonId)) {
            this.listeners.get(comparisonId).delete(callback);
            if (this.listeners.get(comparisonId).size === 0) {
                this.listeners.delete(comparisonId);
            }
        }
    }

    /**
     * @param {string} comparisonId 
     * @param {Object} event 
     */
    emit(comparisonId, event) {
        if (this.listeners.has(comparisonId)) {
            for (const callback of this.listeners.get(comparisonId)) {
                try {
                    callback(event);
                } catch (e) {
                    console.error("SSE Listener error", e);
                }
            }
        }
    }

    /**
     * @param {string} prompt 
     * @param {string[]} [modelIds] 
     * @param {Function} [onEvent]
     * @returns {Promise<string>}
     */
    async compare(prompt, modelIds = null, onEvent = null) {
        const ids = (modelIds && modelIds.length > 0) ? modelIds : DEFAULT_ARENA_MODELS;
        const modelsToQueue = [];
        for (const id of ids) {
            const modelEntry = getModelById ? getModelById(id) : LOCAL_MODELS?.find(m => m.model_id === id);
            if (!modelEntry) {
                throw new Error(`Model ${id} not found in registry`);
            }
            modelsToQueue.push(modelEntry);
        }

        const comparisonId = crypto.randomUUID();
        this.results.set(comparisonId, {
            prompt,
            models: new Map()
        });

        if (typeof onEvent === 'function') {
            this.subscribe(comparisonId, onEvent);
        }

        for (const modelEntry of modelsToQueue) {
            this.queueModel(comparisonId, modelEntry, prompt);
        }

        // Start processing queue if not active
        if (!this.isGenerating) {
            this.processQueue();
        }

        return comparisonId;
    }

    /**
     * @param {string} comparisonId 
     * @param {Object} modelEntry 
     * @param {string} prompt 
     */
    queueModel(comparisonId, modelEntry, prompt) {
        this.queue.push({ comparisonId, modelEntry, prompt });
    }

    /**
     * @param {string} comparisonId 
     * @param {Object} modelEntry 
     * @param {string} prompt 
     */
    async runModel(comparisonId, modelEntry, prompt) {
        this.emit(comparisonId, {
            type: "model_start",
            model_id: modelEntry.model_id,
            comparison_id: comparisonId
        });

        try {
            // Select adapter based on runtime type
            const runtimeType = modelEntry.runtime_type || 'OLLAMA';
            const adapter = (runtimeType === RuntimeType?.TRANSFORMERS_PEFT || runtimeType === 'TRANSFORMERS_PEFT') 
                ? this.peftAdapter 
                : this.ollamaAdapter;

            const onToken = (token) => {
                this.emit(comparisonId, {
                    type: "model_token",
                    model_id: modelEntry.model_id,
                    token: token,
                    comparison_id: comparisonId
                });
            };

            const result = await adapter.generate(
                modelEntry, 
                prompt, 
                { signal: this.abortController?.signal }, 
                onToken
            );

            // Save result
            const compData = this.results.get(comparisonId);
            if (compData) {
                compData.models.set(modelEntry.model_id, result);
            }

            this.emit(comparisonId, {
                type: "model_complete",
                model_id: modelEntry.model_id,
                result: result,
                comparison_id: comparisonId
            });
            
        } catch (error) {
            if (error.name === 'AbortError') {
                this.emit(comparisonId, {
                    type: "model_error",
                    model_id: modelEntry.model_id,
                    error: "Comparison cancelled",
                    comparison_id: comparisonId
                });
            } else {
                console.error(`Error running model ${modelEntry.model_id}:`, error);
                this.emit(comparisonId, {
                    type: "model_error",
                    model_id: modelEntry.model_id,
                    error: error.message || String(error),
                    comparison_id: comparisonId
                });
            }
        }
    }

    async processQueue() {
        if (this.queue.length === 0) {
            this.isGenerating = false;
            this.activeComparison = null;
            return;
        }

        this.isGenerating = true;
        const task = this.queue.shift();
        this.activeComparison = task.comparisonId;
        this.abortController = new AbortController();

        await this.runModel(task.comparisonId, task.modelEntry, task.prompt);

        // Check if all queued tasks for this comparison are done
        const remainingForComparison = this.queue.filter(t => t.comparisonId === task.comparisonId);
        if (remainingForComparison.length === 0) {
            this.emit(task.comparisonId, {
                type: "comparison_complete",
                comparison_id: task.comparisonId
            });
        }

        // Process next
        this.processQueue();
    }

    /**
     * @param {string} comparisonId 
     */
    getStatus(comparisonId) {
        const data = this.results.get(comparisonId);
        if (!data) return null;
        
        const modelsInQueue = this.queue.filter(t => t.comparisonId === comparisonId).map(t => t.modelEntry.model_id);
        const isActive = this.activeComparison === comparisonId;

        return {
            comparisonId,
            isActive,
            completedModels: Array.from(data.models.keys()),
            queuedModels: modelsInQueue
        };
    }

    /**
     * @param {string} comparisonId 
     */
    getResults(comparisonId) {
        const data = this.results.get(comparisonId);
        if (!data) return null;
        
        return {
            prompt: data.prompt,
            models: Object.fromEntries(data.models)
        };
    }

    /**
     * @param {string} comparisonId 
     */
    cancelComparison(comparisonId) {
        this.queue = this.queue.filter(t => t.comparisonId !== comparisonId);
        if (this.activeComparison === comparisonId && this.abortController) {
            this.abortController.abort();
        }
    }

    /**
     * @returns {Array<Object>}
     */
    getAvailableModels() {
        return DEFAULT_ARENA_MODELS.map(id => {
            const entry = getModelById ? getModelById(id) : LOCAL_MODELS?.find(m => m.model_id === id);
            return entry || { model_id: id, name: id, execution_target: "GPU" };
        });
    }

    /**
     * @param {string} comparisonId 
     * @param {number} [timeoutMs]
     * @returns {Promise<void>}
     */
    waitForCompletion(comparisonId, timeoutMs = 300000) {
        return new Promise((resolve) => {
            const check = () => {
                const status = this.getStatus(comparisonId);
                if (!status || (!status.isActive && status.queuedModels.length === 0)) {
                    resolve();
                    return true;
                }
                return false;
            };

            if (check()) return;

            const timer = setTimeout(() => {
                this.unsubscribe(comparisonId, listener);
                resolve();
            }, timeoutMs);

            const listener = (event) => {
                if (event.type === 'comparison_complete' || event.type === 'error') {
                    clearTimeout(timer);
                    this.unsubscribe(comparisonId, listener);
                    resolve();
                }
            };
            this.subscribe(comparisonId, listener);
        });
    }

    /**
     * Cancel all pending and active generations
     */
    cancelAll() {
        this.queue = [];
        if (this.abortController) {
            this.abortController.abort();
        }
        this.isGenerating = false;
        this.activeComparison = null;
    }

    /**
     * Clear all comparisons, results, and listeners
     */
    clearAll() {
        this.cancelAll();
        this.results.clear();
        this.listeners.clear();
    }

    /**
     * @param {string} comparisonId 
     */
    clearComparison(comparisonId) {
        this.cancelComparison(comparisonId);
        this.results.delete(comparisonId);
        this.listeners.delete(comparisonId);
    }
}

export const modelArenaService = new ModelArenaService();
