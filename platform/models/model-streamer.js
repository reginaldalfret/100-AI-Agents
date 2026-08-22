/**
 * Sovereign AI Workbench — Real-Time Model Streamer & VRAM Lifecycle Manager
 * Handles true token-by-token NDJSON streaming from local Ollama (127.0.0.1:11434)
 * with single-model GPU concurrency protection on RTX 2050 4GB.
 */

import http from "node:http";

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
    this.isInferencing = false;
    this.inferenceQueue = [];
    this.activeStreams = new Map(); // reqId -> http.ClientRequest
  }

  /**
   * Acquire execution lock for RTX 2050 (Single GPU-heavy model at a time).
   */
  async acquireExecutionLock(targetModel) {
    if (!this.isInferencing) {
      this.isInferencing = true;
      const isSwitch = this.activeModel && this.activeModel !== targetModel;
      this.activeModel = targetModel;
      this.lastUsedAt = Date.now();
      return { acquired: true, isSwitch };
    }

    // Queue request if another model inference is in flight
    return new Promise((resolve) => {
      this.inferenceQueue.push({
        targetModel,
        resolve
      });
    });
  }

  /**
   * Release execution lock and process next queued request.
   */
  releaseExecutionLock() {
    this.lastUsedAt = Date.now();
    if (this.inferenceQueue.length > 0) {
      const next = this.inferenceQueue.shift();
      const isSwitch = this.activeModel && this.activeModel !== next.targetModel;
      this.activeModel = next.targetModel;
      next.resolve({ acquired: true, isSwitch });
    } else {
      this.isInferencing = false;
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
    const lock = await this.acquireExecutionLock(model);

    try {
      if (lock.isSwitch) {
        onStatus({
          state: ModelLifecycleState.PREPARING,
          message: `Switching and preparing ${model}...`,
          model,
          isSwitch: true
        });
      } else {
        onStatus({
          state: ModelLifecycleState.PREPARING,
          message: `Preparing ${model}...`,
          model,
          isSwitch: false
        });
      }

      const ollamaUrl = new URL(`${DEFAULT_OLLAMA_URL}/api/generate`);
      const payload = {
        model,
        system,
        prompt,
        stream: true,
        think: false,
        keep_alive: "5m", // 5 minutes session affinity to avoid reloading on repeated requests
        options: {
          temperature,
          num_predict: options.num_predict || 512,
          ...options
        }
      };

      if (Array.isArray(images) && images.length > 0) {
        payload.images = images;
      }

      const postData = JSON.stringify(payload);
      const startTime = performance.now();
      let firstTokenTime = null;
      let fullText = "";
      let tokenCount = 0;

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
                    if (!firstTokenTime) {
                      firstTokenTime = performance.now();
                    }
                    fullText += parsed.response;
                    tokenCount++;
                    onToken(parsed.response, fullText);
                  }

                  if (parsed.done) {
                    const totalDuration = Math.round(performance.now() - startTime);
                    const ttft = firstTokenTime ? Math.round(firstTokenTime - startTime) : totalDuration;
                    const evalCount = parsed.eval_count || tokenCount;
                    const evalDurationSec = (parsed.eval_duration || (totalDuration * 1e6)) / 1e9;
                    const tokensPerSec = evalDurationSec > 0 ? Number((evalCount / evalDurationSec).toFixed(2)) : 0;

                    onComplete({
                      text: fullText,
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
      this.releaseExecutionLock();
    }
  }
}

export const modelStreamer = new ModelStreamerManager();
