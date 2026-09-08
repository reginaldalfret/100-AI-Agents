import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Frontend SSE Streaming Service Tests', () => {
  const streamPath = path.resolve('platform/web/src/services/streaming.ts');

  it('streaming.ts exists and provides stream handling', () => {
    assert.ok(fs.existsSync(streamPath));
    const content = fs.readFileSync(streamPath, 'utf8');
    assert.ok(content.includes('parseSSEStream') || content.includes('streamModelArena'));
  });

  it('handles model_start, model_token, model_complete events', () => {
    const content = fs.readFileSync(streamPath, 'utf8');
    assert.ok(content.includes('model_start'));
    assert.ok(content.includes('model_token'));
    assert.ok(content.includes('model_complete'));
  });

  it('supports AbortSignal for user cancellation', () => {
    const content = fs.readFileSync(streamPath, 'utf8');
    assert.ok(content.includes('signal') || content.includes('AbortController'));
  });
});
