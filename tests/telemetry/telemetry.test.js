import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeAttributes,
  withSpan,
  metricsRegistry,
  logger
} from '../../platform/telemetry/index.js';

describe('OpenTelemetry & Observability Subsystem', () => {
  describe('Attribute Sanitization & Privacy Safety', () => {
    it('strips prompt, content, password, and private message data', () => {
      const unsafe = {
        request_id: 'req-123',
        model_id: 'nemotron-3-nano',
        prompt: 'Secret confidential prompt',
        messages: [{ role: 'user', content: 'private message' }],
        password: 'super-secret-password',
        api_key: 'sk-12345',
        device: 'GPU'
      };

      const safe = sanitizeAttributes(unsafe);
      assert.equal(safe.request_id, 'req-123');
      assert.equal(safe.model_id, 'nemotron-3-nano');
      assert.equal(safe.device, 'GPU');

      assert.equal('prompt' in safe, false);
      assert.equal('messages' in safe, false);
      assert.equal('password' in safe, false);
      assert.equal('api_key' in safe, false);
    });
  });

  describe('Span Execution Context', () => {
    it('executes operation inside withSpan and returns result', async () => {
      const result = await withSpan('test-operation', { request_id: 'req-456' }, async (span) => {
        assert.ok(span);
        return 42;
      });
      assert.equal(result, 42);
    });

    it('handles exception inside withSpan cleanly', async () => {
      await assert.rejects(
        async () => {
          await withSpan('failing-op', {}, async () => {
            throw new Error('Planned test error');
          });
        },
        /Planned test error/
      );
    });
  });

  describe('Metrics Registry', () => {
    it('records requests and computes latency snapshot', () => {
      metricsRegistry.recordRequest('/api/chat', 200, 45);
      metricsRegistry.recordRequest('/api/chat', 400, 15);

      const snapshot = metricsRegistry.getSnapshot();
      assert.ok(snapshot.requests.total >= 2);
      assert.ok(snapshot.requests.by_status['2xx'] >= 1);
      assert.ok(snapshot.requests.by_status['4xx'] >= 1);
    });

    it('records model generation telemetry', () => {
      metricsRegistry.recordModelGeneration('nemotron-3-nano', 'ollama', 320, 45, 140.6);
      const snapshot = metricsRegistry.getSnapshot();
      assert.ok(snapshot.model_generations.total >= 1);
      assert.ok(snapshot.model_generations.by_model['nemotron-3-nano'] >= 1);
      assert.ok(snapshot.model_generations.avg_tokens_per_sec > 0);
    });

    it('records GPU VRAM without fabricating metrics', () => {
      metricsRegistry.recordGpuMetrics(2400, 4096);
      const snapshot = metricsRegistry.getSnapshot();
      assert.equal(snapshot.gpu.vramAllocatedMb, 2400);
      assert.equal(snapshot.gpu.vramTotalMb, 4096);
    });
  });
});
