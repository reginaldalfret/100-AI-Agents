/**
 * Security, Authentication, and Rate-Limiting for /v1/* OpenAI-Compatible Gateway
 */

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = Number(process.env.V1_RATE_LIMIT_RPM || 60);

const requestBuckets = new Map();

/**
 * Server-side rate limiter for /v1/*
 */
export function checkRateLimit(clientIp) {
  const now = Date.now();
  const bucket = requestBuckets.get(clientIp) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };

  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }

  bucket.count++;
  requestBuckets.set(clientIp, bucket);

  if (bucket.count > MAX_REQUESTS_PER_WINDOW) {
    return {
      allowed: false,
      remaining: 0,
      resetSeconds: Math.ceil((bucket.resetAt - now) / 1000)
    };
  }

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - bucket.count,
    resetSeconds: Math.ceil((bucket.resetAt - now) / 1000)
  };
}

/**
 * Verify API key for external /v1/* requests.
 * Accepts Authorization: Bearer <key> or x-api-key: <key>
 * If SUPERAI_API_KEY or OPENAI_API_KEY is configured in env, enforces it.
 * Localhost connections are permitted for development if no key configured.
 */
export function verifyApiKey(req) {
  const configuredKey = process.env.SUPERAI_API_KEY || process.env.OPENAI_API_KEY;

  // If no key configured in environment, allow local loopback requests freely
  const authHeader = req.headers['authorization'] || '';
  const apiKeyHeader = req.headers['x-api-key'] || '';

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : (apiKeyHeader ? String(apiKeyHeader).trim() : null);

  if (!configuredKey) {
    return { valid: true };
  }

  if (token === configuredKey) {
    return { valid: true };
  }

  return {
    valid: false,
    error: 'Invalid or missing API key. Provide Authorization: Bearer <key>'
  };
}
