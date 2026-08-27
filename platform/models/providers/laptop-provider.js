/**
 * Sovereign AI Workbench — Laptop Local Model Provider
 */

import http from "node:http";
import { BaseModelProvider } from "./base-provider.js";
import { StreamSanitizer } from "../stream-sanitizer.js";

export class LaptopModelProvider extends BaseModelProvider {
  constructor(config = {}) {
    super({
      id: "laptop-provider",
      name: "Laptop Local Compute Provider",
      nodeId: "node-laptop-01",
      endpoint: config.endpoint || process.env.OLLAMA_URL || "http://127.0.0.1:11434",
      timeoutMs: config.timeoutMs || 30000
    });
  }

  async health() {
    const start = performance.now();
    try {
      const res = await fetch(`${this.endpoint}/api/version`, {
        signal: AbortSignal.timeout(2000)
      });
      const latencyMs = Math.round(performance.now() - start);
      if (res.ok) {
        const data = await res.json();
        return {
          status: "ONLINE",
          latencyMs,
          version: data.version || "Ollama",
          nodeId: this.nodeId
        };
      }
      return { status: "DEGRADED", latencyMs, nodeId: this.nodeId };
    } catch (err) {
      return { status: "OFFLINE", error: err.message, nodeId: this.nodeId };
    }
  }

  async listModels() {
    try {
      const res = await fetch(`${this.endpoint}/api/tags`, {
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const data = await res.json();
        return (data.models || []).map(m => m.name || m.model);
      }
      return [];
    } catch {
      return [];
    }
  }

  async generate({ model, prompt, system = "", options = {} }) {
    const res = await fetch(`${this.endpoint}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        system,
        stream: false,
        options: { temperature: 0.3, num_predict: 512, ...options }
      }),
      signal: AbortSignal.timeout(this.timeoutMs)
    });

    if (!res.ok) {
      throw new Error(`Laptop Ollama returned ${res.status}`);
    }

    const data = await res.json();
    return {
      response: data.response,
      model: data.model,
      total_duration: data.total_duration,
      eval_count: data.eval_count,
      eval_duration: data.eval_duration,
      provider: this.id
    };
  }

  async stream({
    model,
    prompt,
    system = "",
    images = [],
    options = {},
    onToken = () => {},
    onStatus = () => {},
    onComplete = () => {},
    onError = () => {}
  }) {
    const url = new URL(`${this.endpoint}/api/generate`);
    const payload = JSON.stringify({
      model,
      prompt,
      system,
      stream: true,
      think: false,
      options: { temperature: 0.3, num_predict: 512, ...options },
      ...(Array.isArray(images) && images.length > 0 ? { images } : {})
    });

    const sanitizer = new StreamSanitizer();
    let tokenCount = 0;
    const startTime = performance.now();
    let firstTokenTime = null;

    return new Promise((resolve, reject) => {
      const req = http.request(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload)
        }
      }, (res) => {
        if (res.statusCode !== 200) {
          let errBody = "";
          res.on("data", chunk => errBody += chunk);
          res.on("end", () => {
            const err = new Error(`Laptop Ollama error ${res.statusCode}: ${errBody}`);
            onError(err);
            reject(err);
          });
          return;
        }

        onStatus({ state: "streaming", message: `Streaming from Laptop (${model})...` });
        res.setEncoding("utf8");
        let buffer = "";

        res.on("data", (chunk) => {
          buffer += chunk;
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const parsed = JSON.parse(trimmed);
              if (parsed.response) {
                if (!firstTokenTime) firstTokenTime = performance.now();
                tokenCount++;
                const sanitizedChunk = sanitizer.push(parsed.response);
                if (sanitizedChunk) {
                  onToken(sanitizedChunk);
                }
              }
              if (parsed.done) {
                const finalFlush = sanitizer.flush();
                if (finalFlush) onToken(finalFlush);
                const totalDuration = performance.now() - startTime;
                const tokensPerSec = tokenCount > 0 && totalDuration > 0
                  ? Math.round((tokenCount / (totalDuration / 1000)) * 10) / 10
                  : 0;
                const result = {
                  fullText: sanitizer.getVisibleText(),
                  tokensPerSec,
                  tokenCount,
                  durationMs: Math.round(totalDuration),
                  provider: this.id
                };
                onComplete(result);
                resolve(result);
              }
            } catch {}
          }
        });
      });

      req.on("error", (err) => {
        onError(err);
        reject(err);
      });
      req.write(payload);
      req.end();
    });
  }
}

export const laptopProvider = new LaptopModelProvider();
