/**
 * Structured Telemetry Logger with Distributed Trace Correlation
 * Enforces zero-PII and zero-prompt emission.
 */

import { sanitizeAttributes } from './tracer.js';

class StructuredLogger {
  constructor(serviceName = '301-super-ai') {
    this.serviceName = serviceName;
  }

  log(level, message, context = {}) {
    const safeMeta = sanitizeAttributes(context);
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      service: this.serviceName,
      message,
      request_id: context.request_id || context.requestId || undefined,
      trace_id: context.trace_id || context.traceId || undefined,
      model_id: context.model_id || context.modelId || undefined,
      ...safeMeta
    };

    const out = JSON.stringify(logEntry);
    if (level === 'error') {
      console.error(out);
    } else if (level === 'warn') {
      console.warn(out);
    } else {
      console.log(out);
    }
  }

  info(message, context) {
    this.log('info', message, context);
  }

  warn(message, context) {
    this.log('warn', message, context);
  }

  error(message, context) {
    this.log('error', message, context);
  }
}

export const logger = new StructuredLogger();
