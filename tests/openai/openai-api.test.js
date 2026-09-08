import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OpenAIChatCompletionSchema } from '../../platform/gateway/src/openai/openai-schema.js';
import { checkRateLimit, verifyApiKey } from '../../platform/gateway/src/openai/auth-ratelimit.js';
import { LOCAL_MODELS } from '../../platform/models/model-registry.js';

describe('OpenAI-Compatible 301 API Subsystem', () => {
  describe('OpenAIChatCompletionSchema Validation', () => {
    it('accepts valid OpenAI chat completion payload', () => {
      const result = OpenAIChatCompletionSchema.safeParse({
        model: 'nemotron-3-nano',
        messages: [{ role: 'user', content: 'Hello 301 Super AI' }],
        stream: false
      });
      assert.equal(result.success, true);
    });

    it('rejects payload missing model', () => {
      const result = OpenAIChatCompletionSchema.safeParse({
        messages: [{ role: 'user', content: 'Hello' }]
      });
      assert.equal(result.success, false);
    });

    it('rejects payload with empty messages array', () => {
      const result = OpenAIChatCompletionSchema.safeParse({
        model: 'nemotron-3-nano',
        messages: []
      });
      assert.equal(result.success, false);
    });
  });

  describe('Model Registry Alignment', () => {
    it('all models from LOCAL_MODELS can be mapped to OpenAI model objects', () => {
      const mapped = LOCAL_MODELS.map(m => ({
        id: m.model_id,
        object: 'model',
        created: 1725800000,
        owned_by: (m.provider || 'local').toLowerCase()
      }));

      assert.ok(mapped.length >= 18);
      const nemotron = mapped.find(m => m.id === 'nemotron-3-nano');
      assert.ok(nemotron);
      assert.equal(nemotron.object, 'model');
      assert.equal(nemotron.owned_by, 'nvidia');
    });
  });

  describe('Rate Limiting & Authentication', () => {
    it('allows requests within rate limit window', () => {
      const check = checkRateLimit('192.168.1.50');
      assert.equal(check.allowed, true);
      assert.ok(check.remaining >= 0);
    });

    it('verifies requests when no secret key configured in local dev', () => {
      const mockReq = { headers: {} };
      const auth = verifyApiKey(mockReq);
      assert.equal(auth.valid, true);
    });
  });
});
