import { z } from 'zod';
export { ChatRequestSchema, ChatMessageSchema } from './chat.schema.js';
export { ArenaCompareSchema, ArenaActionSchema } from './arena.schema.js';
export { PersonalStyleChatSchema, PersonalStyleActionSchema } from './personal-style.schema.js';
export { DatasetQuerySchema } from './dataset.schema.js';
export { FineTuneJobCreateSchema } from './finetune.schema.js';
export { ModelQuerySchema } from './model.schema.js';
export { TelemetryEventSchema } from './telemetry.schema.js';

/**
 * Validates request payload against Zod schema.
 * Returns { success: true, data } or { success: false, error: { code: 'VALIDATION_ERROR', message: '...' } }
 */
export function validate(schema, payload) {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const message = firstIssue ? `${firstIssue.path.join('.')}: ${firstIssue.message}`.replace(/^:\s*/, '') : 'Invalid request';
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: message || 'Invalid request'
      }
    };
  }
  return {
    success: true,
    data: result.data
  };
}

/**
 * Standard validation error response generator
 */
export function validationErrorResponse(res, validationError) {
  res.writeHead(400, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: {
      code: 'VALIDATION_ERROR',
      message: validationError?.message || 'Invalid request'
    }
  }));
}
