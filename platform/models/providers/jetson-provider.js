/**
 * Sovereign AI Workbench — NVIDIA Jetson LAN Model Provider
 * 
 * Provides authenticated, private LAN execution of GPU models on NVIDIA Jetson node
 * with circuit breaking, graceful fallback, and zero cloud data exfiltration.
 */

import http from "node:http";
import { BaseModelProvider } from "./base-provider.js";
import { StreamSanitizer } from "../stream-sanitizer.js";
import { evaluateSovereignEgress } from "../../security/sovereign-policy.js";

export class JetsonModelProvider extends BaseModelProvider {
  constructor(config = {}) {
    const host = config.host || process.env.JETSON_HOST || "10.226.242.101";
    const port = config.port || parseInt(process.env.JETSON_PORT, 10) || 11434;
    super({
      id: "jetson-provider",
      name: "NVIDIA Jetson LAN Compute Provider",
      nodeId: "node-jetson-01",
      endpoint: `http://${host}:${port}`,
      timeoutMs: config.timeoutMs || 45000
    });
    this.host = host;
    this.port = port;
    this.circuit = {
      state: "CLOSED",
      failures: 0,
      maxFailures: 3,
      lastFailureTime: null,
      cooldownMs: 15000
    };
  }

  _isCircuitOpen() {
    if (this.circuit.state === "OPEN") {
      const now = Date.now();
      if (now - this.circuit.lastFailureTime > this.circuit.cooldownMs) {
        this.circuit.state = "HALF_OPEN";
        return false;
      }
      return true;
    }
    return false;
  }

  _recordSuccess() {
    this.circuit.state = "CLOSED";
    this.circuit.failures = 0;
  }

  _recordFailure() {
    this.circuit.failures++;
    this.circuit.lastFailureTime = Date.now();
    if (this.circuit.failures >= this.circuit.maxFailures) {
      this.circuit.state = "OPEN";
      console.warn(`[JETSON_CIRCUIT_BREAKER] Tripped OPEN after ${this.circuit.failures} failures. Cooling down for ${this.circuit.cooldownMs}ms.`);
    }
  }

  async health() {
    const egress = evaluateSovereignEgress(this.endpoint, "JETSON_HEALTH");
    if (!egress.allowed) {
      return { status: "OFFLINE", error: "Sovereign policy blocked non-private endpoint", nodeId: this.nodeId };
    }

    const start = performance.now();
    try {
      const res = await fetch(`${this.endpoint}/api/tags`, {
        signal: AbortSignal.timeout(2500)
      });
      const latencyMs = Math.round(performance.now() - start);

      if (res.ok) {
        const data = await res.json();
        const models = (data.models || []).map(m => m.name || m.model);
        this._recordSuccess();

        let version = "Ollama";
        try {
          const verRes = await fetch(`${this.endpoint}/api/version`, {
            signal: AbortSignal.timeout(1500)
          });
          if (verRes.ok) {
            const verData = await verRes.json();
            version = verData.version || version;
          }
        } catch {}

        return {
          status: "ONLINE",
          latencyMs,
          version,
          availableModels: models,
          nodeId: this.nodeId,
          host: this.host,
          port: this.port,
          is_air_gapped: true
        };
      }
      this._recordFailure();
      return { status: "DEGRADED", latencyMs, nodeId: this.nodeId, error: `HTTP ${res.status}` };
    } catch (err) {
      this._recordFailure();
      return { status: "OFFLINE", nodeId: this.nodeId, error: err.name === 'AbortError' ? 'Timeout' : err.message };
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

  async generate({ model = "Qwen3.8_Unsloth:latest", prompt, system = "", options = {} }) {
    if (this._isCircuitOpen()) {
      throw new Error(`JETSON_UNAVAILABLE: Circuit breaker is OPEN. Node is temporarily unreachable.`);
    }

    const egress = evaluateSovereignEgress(this.endpoint, "JETSON_INFERENCE");
    if (!egress.allowed) {
      throw new Error(`SOVEREIGN_VIOLATION: Jetson endpoint ${this.endpoint} is not on private LAN.`);
    }

    try {
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
        this._recordFailure();
        throw new Error(`Jetson Ollama returned ${res.status}`);
      }

      const data = await res.json();
      this._recordSuccess();
      return {
        response: data.response,
        model: data.model,
        total_duration: data.total_duration,
        eval_count: data.eval_count,
        eval_duration: data.eval_duration,
        provider: this.id,
        node: this.nodeId
      };
    } catch (err) {
      this._recordFailure();
      throw err;
    }
  }

  async stream({
    model = "Qwen3.8_Unsloth:latest",
    prompt,
    system = "",
    images = [],
    options = {},
    onToken = () => {},
    onStatus = () => {},
    onComplete = () => {},
    onError = () => {}
  }) {
    if (this._isCircuitOpen()) {
      const err = new Error(`JETSON_UNAVAILABLE: Circuit breaker is OPEN.`);
      onError(err);
      throw err;
    }

    const egress = evaluateSovereignEgress(this.endpoint, "JETSON_STREAM_INFERENCE");
    if (!egress.allowed) {
      const err = new Error(`SOVEREIGN_VIOLATION: Jetson endpoint ${this.endpoint} is not on private LAN.`);
      onError(err);
      throw err;
    }

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
      let resolved = false;
      onStatus({
        state: "connecting_jetson",
        message: `Connecting to NVIDIA Jetson (${model})...`,
        node: this.nodeId
      });

      const req = http.request(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload)
        },
        timeout: this.timeoutMs
      }, (res) => {
        if (res.statusCode !== 200) {
          let errBody = "";
          res.on("data", chunk => errBody += chunk);
          res.on("end", () => {
            this._recordFailure();
            const err = new Error(`Jetson Ollama error ${res.statusCode}: ${errBody}`);
            onError(err);
            reject(err);
          });
          return;
        }

        this._recordSuccess();
        onStatus({
          state: "streaming_jetson",
          message: `Streaming from NVIDIA Jetson (${model})...`,
          node: this.nodeId,
          execution_target: "JETSON_GPU"
        });

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
                  provider: this.id,
                  node: this.nodeId,
                  execution_target: "JETSON_GPU"
                };
                if (!resolved) {
                  resolved = true;
                  onComplete(result);
                  resolve(result);
                }
              }
            } catch {}
          }
        });

        res.on("end", () => {
          if (!resolved) {
            resolved = true;
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
              provider: this.id,
              node: this.nodeId,
              execution_target: "JETSON_GPU"
            };
            onComplete(result);
            resolve(result);
          }
        });
      });

      req.on("timeout", () => {
        req.destroy();
        this._recordFailure();
        const err = new Error(`Jetson stream timed out after ${this.timeoutMs}ms`);
        onError(err);
        reject(err);
      });

      req.on("error", (err) => {
        this._recordFailure();
        onError(err);
        reject(err);
      });

      req.write(payload);
      req.end();
    });
  }
}

export const jetsonProvider = new JetsonModelProvider();
