import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ChatRequestSchema,
  ArenaCompareSchema,
  PersonalStyleChatSchema,
  DatasetQuerySchema,
  FineTuneJobCreateSchema,
  validate
} from '../../platform/gateway/src/schemas/index.js';

describe('Zod API Request Validation Suite', () => {
  describe('ChatRequestSchema', () => {
    it('accepts valid message payload', () => {
      const result = validate(ChatRequestSchema, {
        message: 'Hello Super AI',
        stream: true
      });
      assert.equal(result.success, true);
    });

    it('rejects empty payload without prompt or messages', () => {
      const result = validate(ChatRequestSchema, {});
      assert.equal(result.success, false);
      assert.equal(result.error.code, 'VALIDATION_ERROR');
    });

    it('accepts valid messages array', () => {
      const result = validate(ChatRequestSchema, {
        messages: [{ role: 'user', content: 'What is 2+2?' }]
      });
      assert.equal(result.success, true);
    });
  });

  describe('ArenaCompareSchema', () => {
    it('accepts valid arena comparison prompt', () => {
      const result = validate(ArenaCompareSchema, {
        prompt: 'Explain quantum computing',
        stream: true
      });
      assert.equal(result.success, true);
    });

    it('rejects empty prompt in arena comparison', () => {
      const result = validate(ArenaCompareSchema, {
        prompt: '   '
      });
      assert.equal(result.success, false);
      assert.equal(result.error.code, 'VALIDATION_ERROR');
    });

    it('rejects arena comparison when model_ids array is not exactly 8 models', () => {
      const result = validate(ArenaCompareSchema, {
        prompt: 'Test',
        model_ids: ['nemotron-3-nano', 'gemma3-1b']
      });
      assert.equal(result.success, false);
      assert.equal(result.error.code, 'VALIDATION_ERROR');
    });
  });

  describe('PersonalStyleChatSchema', () => {
    it('accepts valid personal style chat payload', () => {
      const result = validate(PersonalStyleChatSchema, {
        session_id: 'session-123',
        messages: [{ role: 'user', content: 'Hey Kaviya' }]
      });
      assert.equal(result.success, true);
    });

    it('rejects empty personal style chat payload', () => {
      const result = validate(PersonalStyleChatSchema, {});
      assert.equal(result.success, false);
      assert.equal(result.error.code, 'VALIDATION_ERROR');
    });
  });

  describe('DatasetQuerySchema', () => {
    it('accepts valid dataset query with sql', () => {
      const result = validate(DatasetQuerySchema, {
        dataset_id: 'ds-industrial-iot',
        sql: 'SELECT * FROM sensor_logs LIMIT 10'
      });
      assert.equal(result.success, true);
    });

    it('rejects query without question, query or sql', () => {
      const result = validate(DatasetQuerySchema, {
        dataset_id: 'ds-industrial-iot'
      });
      assert.equal(result.success, false);
      assert.equal(result.error.code, 'VALIDATION_ERROR');
    });
  });

  describe('FineTuneJobCreateSchema', () => {
    it('accepts valid fine-tuning job specification', () => {
      const result = validate(FineTuneJobCreateSchema, {
        name: 'test-qlora-job',
        dataset: 'safety-dataset-v1',
        epochs: 3
      });
      assert.equal(result.success, true);
      assert.equal(result.data.method, 'QLoRA');
    });

    it('rejects fine-tuning job with invalid learning rate format', () => {
      const result = validate(FineTuneJobCreateSchema, {
        name: 'test-job',
        dataset: 'safety-dataset-v1',
        learningRate: 'very-fast'
      });
      assert.equal(result.success, false);
      assert.equal(result.error.code, 'VALIDATION_ERROR');
    });
  });
});
