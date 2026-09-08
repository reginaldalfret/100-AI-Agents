/**
 * OpenTelemetry & In-Memory Metrics Collector
 * Aggregates runtime telemetry without fabricating metrics.
 */

class MetricsRegistry {
  constructor() {
    this.requestsTotal = 0;
    this.requestsByEndpoint = new Map();
    this.requestsByStatus = new Map();
    this.requestLatencies = [];

    this.modelGenerationsTotal = 0;
    this.modelGenerationsById = new Map();
    this.generationLatencies = [];
    this.tokensPerSecReadings = [];

    this.queueMetrics = new Map();
    this.gpuMetrics = {
      vramAllocatedMb: null,
      vramTotalMb: 4096, // RTX 2050
      lastUpdated: null
    };
  }

  recordRequest(endpoint, statusCode, durationMs) {
    this.requestsTotal++;

    const epCount = this.requestsByEndpoint.get(endpoint) || 0;
    this.requestsByEndpoint.set(endpoint, epCount + 1);

    const statusGroup = `${Math.floor(statusCode / 100)}xx`;
    const statusCount = this.requestsByStatus.get(statusGroup) || 0;
    this.requestsByStatus.set(statusGroup, statusCount + 1);

    if (this.requestLatencies.length > 200) this.requestLatencies.shift();
    this.requestLatencies.push(durationMs);
  }

  recordModelGeneration(modelId, runtime, durationMs, tokensCount = 0, tokPerSec = null) {
    this.modelGenerationsTotal++;

    const count = this.modelGenerationsById.get(modelId) || 0;
    this.modelGenerationsById.set(modelId, count + 1);

    if (this.generationLatencies.length > 200) this.generationLatencies.shift();
    this.generationLatencies.push(durationMs);

    if (typeof tokPerSec === 'number' && tokPerSec > 0) {
      if (this.tokensPerSecReadings.length > 200) this.tokensPerSecReadings.shift();
      this.tokensPerSecReadings.push(tokPerSec);
    }
  }

  recordQueueMetrics(queueName, counts = {}) {
    this.queueMetrics.set(queueName, {
      ...counts,
      timestamp: new Date().toISOString()
    });
  }

  recordGpuMetrics(allocatedMb, totalMb = 4096) {
    if (typeof allocatedMb === 'number') {
      this.gpuMetrics.vramAllocatedMb = allocatedMb;
      this.gpuMetrics.vramTotalMb = totalMb;
      this.gpuMetrics.lastUpdated = new Date().toISOString();
    }
  }

  getSnapshot() {
    const avgLatency = this.requestLatencies.length > 0
      ? Math.round(this.requestLatencies.reduce((a, b) => a + b, 0) / this.requestLatencies.length)
      : 0;

    const avgGenDuration = this.generationLatencies.length > 0
      ? Math.round(this.generationLatencies.reduce((a, b) => a + b, 0) / this.generationLatencies.length)
      : 0;

    const avgTps = this.tokensPerSecReadings.length > 0
      ? Number((this.tokensPerSecReadings.reduce((a, b) => a + b, 0) / this.tokensPerSecReadings.length).toFixed(2))
      : null;

    return {
      requests: {
        total: this.requestsTotal,
        by_status: Object.fromEntries(this.requestsByStatus),
        avg_latency_ms: avgLatency
      },
      model_generations: {
        total: this.modelGenerationsTotal,
        by_model: Object.fromEntries(this.modelGenerationsById),
        avg_duration_ms: avgGenDuration,
        avg_tokens_per_sec: avgTps
      },
      queues: Object.fromEntries(this.queueMetrics),
      gpu: this.gpuMetrics
    };
  }
}

export const metricsRegistry = new MetricsRegistry();
