/**
 * Sovereign AI Workbench — Real-Time Model Streamer & VRAM Lifecycle Manager
 * Handles true token-by-token NDJSON streaming from local Ollama (127.0.0.1:11434)
 * with single-model GPU concurrency protection on RTX 2050 4GB.
 */

import http from "node:http";
import { StreamSanitizer } from "./stream-sanitizer.js";
import { isCpuModel, getModelById } from "./model-registry.js";

const DEFAULT_OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";

export const ModelLifecycleState = {
  UNLOADED: "unloaded",
  PREPARING: "preparing_model",
  ACTIVE: "model_ready",
  STREAMING: "streaming_tokens",
  IDLE: "idle",
  ERROR: "error"
};

class ModelStreamerManager {
  constructor() {
    this.activeModel = null;
    this.lastUsedAt = null;
    this.sessionAffinityModel = null;
    this.currentLockHolder = null;
    this.inferenceQueue = [];
    this.activeStreams = new Map(); // reqId -> http.ClientRequest
  }

  /**
   * Acquire execution lock for RTX 2050 (Single GPU-heavy model at a time).
   * CPU-only models bypass the GPU lock to run concurrently on Intel CPU without consuming VRAM.
   */
  async acquireExecutionLock(targetModel, reqId = `lock_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`) {
    if (isCpuModel(targetModel)) {
      return { acquired: true, isSwitch: false, isCpu: true, lockId: reqId };
    }

    // Auto-heal orphaned locks if held > 20 seconds with 0 active streams
    const now = Date.now();
    if (this.currentLockHolder && this.activeStreams.size === 0 && this.lastUsedAt && (now - this.lastUsedAt > 20000)) {
      console.warn(`[VRAM_LOCK_WATCHDOG] Force-recovering orphaned GPU lock '${this.currentLockHolder}' after 20s idle.`);
      this.currentLockHolder = null;
    }

    if (!this.currentLockHolder) {
      this.currentLockHolder = reqId;
      const isSwitch = this.activeModel && this.activeModel !== targetModel;
      this.activeModel = targetModel;
      this.lastUsedAt = Date.now();
      return { acquired: true, isSwitch, isCpu: false, lockId: reqId };
    }

    // Queue request if another GPU model inference is in flight
    return new Promise((resolve) => {
      let resolved = false;
      const queueItem = {
        targetModel,
        reqId,
        resolve: (val) => {
          if (!resolved) {
            resolved = true;
            if (queueItem.timeoutId) clearTimeout(queueItem.timeoutId);
            this.currentLockHolder = reqId;
            const isSwitch = this.activeModel && this.activeModel !== targetModel;
            this.activeModel = targetModel;
            this.lastUsedAt = Date.now();
            resolve({ ...val, lockId: reqId, isSwitch });
          }
        }
      };

      queueItem.timeoutId = setTimeout(() => {
        const idx = this.inferenceQueue.indexOf(queueItem);
        if (idx !== -1) {
          this.inferenceQueue.splice(idx, 1);
        }
        console.warn(`[VRAM_LOCK_TIMEOUT] Queue wait timed out for model '${targetModel}'. Force-acquiring lock.`);
        queueItem.resolve({ acquired: true, isCpu: false, forceAcquired: true });
      }, 6000);

      this.inferenceQueue.push(queueItem);
    });
  }

  /**
   * Release execution lock and process next queued request.
   */
  releaseExecutionLock(lockContext = {}) {
    if (lockContext.isCpu) {
      return; // CPU models don't hold the GPU mutex lock
    }

    // If caller provided lockId, ensure it matches current holder
    if (this.currentLockHolder && lockContext.lockId && this.currentLockHolder !== lockContext.lockId) {
      return;
    }

    this.currentLockHolder = null;
    this.lastUsedAt = Date.now();

    while (this.inferenceQueue.length > 0) {
      const next = this.inferenceQueue.shift();
      if (next) {
        next.resolve({ acquired: true, isCpu: false });
        return;
      }
    }
  }

  /**
   * Cancel an active streaming request cleanly.
   */
  cancelStream(requestId) {
    if (this.activeStreams.has(requestId)) {
      const req = this.activeStreams.get(requestId);
      try {
        req.destroy();
      } catch {
        // Ignored
      }
      this.activeStreams.delete(requestId);
      if (this.activeStreams.size === 0) {
        this.releaseExecutionLock();
      }
      return true;
    }
    return false;
  }

  /**
   * Stream completion from local Ollama via chunked NDJSON.
   */
  async streamFromOllama({
    model,
    system = "",
    prompt = "",
    images = [],
    temperature = 0.3,
    options = {},
    requestId = `req_${Date.now()}`,
    onStatus = () => {},
    onToken = () => {},
    onComplete = () => {},
    onError = () => {}
  }) {
    const lock = await this.acquireExecutionLock(model, requestId);

    try {
      if (lock.isCpu) {
        onStatus({
          state: ModelLifecycleState.PREPARING,
          message: `Preparing ${model} (CPU-Only Mode)...`,
          model,
          isSwitch: false,
          execution_target: "CPU"
        });
      } else if (lock.isSwitch) {
        onStatus({
          state: ModelLifecycleState.PREPARING,
          message: `Switching and preparing ${model}...`,
          model,
          isSwitch: true,
          execution_target: "GPU"
        });
      } else {
        onStatus({
          state: ModelLifecycleState.PREPARING,
          message: `Preparing ${model}...`,
          model,
          isSwitch: false,
          execution_target: "GPU"
        });
      }

      const ollamaUrl = new URL(`${DEFAULT_OLLAMA_URL}/api/generate`);
      const isCpu = lock.isCpu || isCpuModel(model);

      let finalSystem = system;
      let finalPrompt = prompt;
      let finalOptions = {
        temperature,
        num_predict: options.num_predict || 512,
        ...options
      };

      if (isCpu) {
        finalOptions.num_gpu = 0; // Strictly offload 0 layers to GPU — 100% CPU execution
      }

      const payload = {
        model,
        system: finalSystem,
        prompt: finalPrompt,
        stream: true,
        think: false,
        keep_alive: "5m", // 5 minutes session affinity to avoid reloading on repeated requests
        options: finalOptions
      };

      if (Array.isArray(images) && images.length > 0) {
        payload.images = images;
      }

      const postData = JSON.stringify(payload);
      const startTime = performance.now();
      let firstTokenTime = null;
      let tokenCount = 0;
      const sanitizer = new StreamSanitizer();

      await new Promise((resolve, reject) => {
        const req = http.request(
          ollamaUrl,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(postData)
            }
          },
          (res) => {
            if (res.statusCode !== 200) {
              let errBody = "";
              res.on("data", (chunk) => { errBody += chunk; });
              res.on("end", () => {
                reject(new Error(`Ollama returned status ${res.statusCode}: ${errBody || res.statusMessage}`));
              });
              return;
            }

            onStatus({
              state: ModelLifecycleState.ACTIVE,
              message: `${model} active`,
              model
            });

            res.setEncoding("utf8");
            let buffer = "";

            res.on("data", (chunk) => {
              buffer += chunk;
              const lines = buffer.split("\n");
              buffer = lines.pop() || ""; // keep incomplete tail

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                try {
                  const parsed = JSON.parse(trimmed);
                  if (parsed.response) {
                    const visibleChunk = sanitizer.push(parsed.response);
                    if (visibleChunk) {
                      if (!firstTokenTime) {
                        firstTokenTime = performance.now();
                      }
                      tokenCount++;
                      onToken(visibleChunk, sanitizer.getVisibleText());
                    }
                  }

                  if (parsed.done) {
                    const tail = sanitizer.flush();
                    if (tail) {
                      if (!firstTokenTime) {
                        firstTokenTime = performance.now();
                      }
                      tokenCount++;
                      onToken(tail, sanitizer.getVisibleText());
                    }

                    let finalVisibleText = sanitizer.getVisibleText();
                    if (!finalVisibleText.trim()) {
                      finalVisibleText = "The model produced no visible answer.";
                    }

                    const totalDuration = Math.round(performance.now() - startTime);
                    const ttft = firstTokenTime ? Math.round(firstTokenTime - startTime) : totalDuration;
                    const evalCount = parsed.eval_count || tokenCount;
                    const evalDurationSec = (parsed.eval_duration || (totalDuration * 1e6)) / 1e9;
                    const tokensPerSec = evalDurationSec > 0 ? Number((evalCount / evalDurationSec).toFixed(2)) : 0;

                    onComplete({
                      text: finalVisibleText,
                      actual_model: parsed.model || model,
                      total_tokens: evalCount,
                      ttft_ms: ttft,
                      duration_ms: totalDuration,
                      tokens_per_sec: tokensPerSec,
                      external_calls: 0,
                      is_air_gapped: true
                    });
                    resolve();
                  }
                } catch {
                  // Partial JSON line in buffer, wait for next chunk
                }
              }
            });

            res.on("end", () => {
              resolve();
            });

            res.on("error", (err) => {
              reject(err);
            });
          }
        );

        this.activeStreams.set(requestId, req);

        req.on("error", (err) => {
          this.activeStreams.delete(requestId);
          reject(err);
        });

        req.write(postData);
        req.end();
      });
    } catch (err) {
      onError(err);
      throw err;
    } finally {
      this.activeStreams.delete(requestId);
      this.releaseExecutionLock(lock);
    }
  }

  /**
   * Non-streaming single-shot generation from Ollama.
   * Used for Stage 1 vision extraction in the two-stage pipeline.
   */
  async generateFromOllama({
    model,
    system = "",
    prompt = "",
    images = [],
    temperature = 0.3,
    options = {}
  }) {
    const lock = await this.acquireExecutionLock(model);

    try {
      const ollamaUrl = new URL(`${DEFAULT_OLLAMA_URL}/api/generate`);
      const isCpu = lock.isCpu || isCpuModel(model);

      const finalOptions = {
        temperature,
        num_predict: options.num_predict || 1024,
        ...options
      };

      if (isCpu) {
        finalOptions.num_gpu = 0; // Strictly 0 GPU layers offload
      }

      const payload = {
        model,
        system,
        prompt,
        stream: false,
        think: false,
        keep_alive: "5m",
        options: finalOptions
      };

      if (Array.isArray(images) && images.length > 0) {
        payload.images = images;
      }

      const postData = JSON.stringify(payload);

      return await new Promise((resolve, reject) => {
        const req = http.request(
          ollamaUrl,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(postData)
            }
          },
          (res) => {
            let body = "";
            res.setEncoding("utf8");
            res.on("data", (chunk) => { body += chunk; });
            res.on("end", () => {
              if (res.statusCode !== 200) {
                reject(new Error(`Ollama returned status ${res.statusCode}: ${body || res.statusMessage}`));
                return;
              }
              try {
                const parsed = JSON.parse(body);
                let cleanText = StreamSanitizer.sanitizeFullText(parsed.response || "");
                if (!cleanText.trim()) {
                  cleanText = "The model produced no visible answer.";
                }
                resolve({
                  text: cleanText,
                  model: parsed.model || model,
                  total_duration: parsed.total_duration,
                  eval_count: parsed.eval_count
                });
              } catch (parseErr) {
                reject(new Error(`Failed to parse Ollama response: ${parseErr.message}`));
              }
            });
            res.on("error", reject);
          }
        );

        req.on("error", reject);
        req.write(postData);
        req.end();
      });
    } finally {
      this.releaseExecutionLock(lock);
    }
  }
}

export const modelStreamer = new ModelStreamerManager();

/**
 * Generic multi-runtime local model execution interface.
 * Dispatches to Ollama, Python/ONNX/ExecuTorch runtime (127.0.0.1:8305), or direct engine
 * while maintaining 0 external calls, 0 GPU VRAM for CPU models, and clean stream sanitization.
 */
export async function runLocalModel({
  model,
  runtime,
  executionTarget,
  prompt,
  system = "",
  options = {}
}) {
  const modelSpec = getModelById(model);
  const isCpu = isCpuModel(model);
  const execTarget = executionTarget || modelSpec?.execution_target || (isCpu ? "CPU" : "GPU");
  const runtimeType = runtime || modelSpec?.runtime_type || (modelSpec?.endpoint?.includes("11434") ? "OLLAMA" : (isCpu ? "CPU" : "OLLAMA"));

  if (runtimeType === "OLLAMA" || (modelSpec && modelSpec.runtime_type === "OLLAMA")) {
    let finalModel = modelSpec?.ollama_name || model;
    let finalSystem = system;
    let finalPrompt = prompt;
    let overrideOptions = execTarget === "CPU" ? { num_gpu: 0, ...options } : options;

    const res = await modelStreamer.generateFromOllama({
      model: finalModel,
      prompt: finalPrompt,
      system: finalSystem,
      options: overrideOptions
    });
    return {
      ...res,
      execution_target: execTarget,
      runtime_type: "OLLAMA",
      provider: modelSpec?.provider || "Local",
      is_air_gapped: true,
      external_calls: 0
    };
  }

  // Multi-runtime CPU inference (ExecuTorch ONNX INT4 or PyTorch on port 8305)
  const targetEndpoint = modelSpec?.endpoint || "http://127.0.0.1:8305";
  const canonicalModelName = modelSpec?.model_id || model;

  try {
    const res = await fetch(`${targetEndpoint}/llm/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: canonicalModelName,
        prompt,
        system,
        max_tokens: options.num_predict || options.max_tokens || 256,
        temperature: options.temperature !== undefined ? options.temperature : 0.7,
        top_p: options.top_p || 0.9,
        repetition_penalty: options.repetition_penalty || 1.15
      }),
      signal: AbortSignal.timeout(options.timeoutMs || 60000)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        const payload = data.data;
        return {
          text: payload.text || "Execution completed.",
          model: payload.model || canonicalModelName,
          provider: modelSpec?.provider || "Local",
          runtime_type: payload.runtime || runtimeType,
          execution_target: "CPU",
          total_duration: (payload.duration_ms || 1000) * 1e6,
          eval_count: payload.tokens_generated || 50,
          tokens_per_sec: payload.tokens_per_sec || 0,
          is_air_gapped: true,
          external_calls: 0
        };
      }
    }
  } catch (err) {
    console.warn(`[MULTI_RUNTIME_INFERENCE] Error connecting to ${targetEndpoint}: ${err.message}`);
  }

  // If Python compute server is offline or unreachable
  return {
    text: `[${modelSpec?.name || model} Error]\nLocal CPU inference service at ${targetEndpoint} is currently unreachable. Please ensure the Sovereign Compute service is running.`,
    model: modelSpec?.model_id || model,
    provider: modelSpec?.provider || "Local",
    runtime_type: runtimeType,
    execution_target: execTarget,
    total_duration: 0,
    eval_count: 0
  };
}
