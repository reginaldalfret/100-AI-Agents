import { trace, context, SpanStatusCode } from '@opentelemetry/api';

const TRACER_NAME = '301-super-ai-tracer';
const TRACER_VERSION = '2.0.0';

const tracer = trace.getTracer(TRACER_NAME, TRACER_VERSION);

// Sensitive keys that must NEVER be recorded in traces
const DISALLOWED_KEYS = new Set([
  'prompt',
  'message',
  'messages',
  'content',
  'text',
  'raw',
  'body',
  'token',
  'password',
  'secret',
  'authorization',
  'api_key',
  'apiKey',
  'email',
  'phone'
]);

/**
 * Filter and sanitize trace attributes to guarantee privacy and air-gap safety.
 */
export function sanitizeAttributes(attrs = {}) {
  const safe = {};
  for (const [key, value] of Object.entries(attrs)) {
    const lower = key.toLowerCase();
    if (DISALLOWED_KEYS.has(lower) || lower.includes('prompt') || lower.includes('token') || lower.includes('key')) {
      continue;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      safe[key] = value;
    }
  }
  return safe;
}

/**
 * Start a safe span with sanitized attributes.
 */
export function startSpan(name, attributes = {}) {
  const safeAttrs = sanitizeAttributes(attributes);
  return tracer.startSpan(name, { attributes: safeAttrs });
}

/**
 * Execute an async operation within an OpenTelemetry span context.
 */
export async function withSpan(name, attributes = {}, fn) {
  const span = startSpan(name, attributes);
  const ctx = trace.setSpan(context.active(), span);

  try {
    const result = await context.with(ctx, () => fn(span));
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (err) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: err.message
    });
    span.recordException(err);
    throw err;
  } finally {
    span.end();
  }
}
