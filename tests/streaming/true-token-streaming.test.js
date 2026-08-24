/**
 * True Real-Time Token Streaming Test Suite (Hardware-Safe Low-Load)
 * Verifies SSE stream transport, progressive chunk delivery, actual model metadata,
 * and clean client cancellation without GPU stress on RTX 2050 4GB.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

const GATEWAY_URL = 'http://127.0.0.1:8300';

async function isGatewayAvailable() {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/health`, { method: 'GET', signal: AbortSignal.timeout(1000) });
    return res.ok;
  } catch {
    return false;
  }
}

function readSSE(payload, onEvent) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ ...payload, stream: true });
    const req = http.request(
      `${GATEWAY_URL}/api/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Content-Length': Buffer.byteLength(body)
        }
      },
      (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Server returned status ${res.statusCode}`));
          return;
        }

        res.setEncoding('utf8');
        let buffer = '';

        res.on('data', (chunk) => {
          buffer += chunk;
          const events = buffer.split('\n\n');
          buffer = events.pop() || '';

          for (const ev of events) {
            if (!ev.trim()) continue;
            const lines = ev.split('\n');
            let eventType = 'message';
            let eventData = '';

            for (const line of lines) {
              if (line.startsWith('event:')) {
                eventType = line.replace('event:', '').trim();
              } else if (line.startsWith('data:')) {
                eventData = line.replace('data:', '').trim();
              }
            }

            if (eventData) {
              try {
                const parsed = JSON.parse(eventData);
                onEvent(eventType, parsed, req);
              } catch {
                // Ignore incomplete JSON
              }
            }
          }
        });

        res.on('end', () => {
          resolve();
        });

        res.on('error', reject);
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

describe('True Real-Time Token Streaming Test Suite', async () => {
  const gatewayOnline = await isGatewayAvailable();

  it('Progressive token chunks stream incrementally with verified model metadata', async (t) => {
    if (!gatewayOnline) {
      t.skip('Gateway is offline at 127.0.0.1:8300; skipping live network SSE streaming test');
      return;
    }

    const receivedTokens = [];
    let receivedMetadata = null;
    let receivedComplete = null;

    await readSSE({
      agent_id: 'agent-101',
      task: 'Write a 1-line Python hello world function.',
      modelMode: 'qwen',
      model_override: 'qwen2.5-coder:1.5b',
      parameters: { max_tokens: 35 }
    }, (type, data) => {
      if (type === 'metadata') {
        receivedMetadata = data;
      } else if (type === 'token') {
        receivedTokens.push(data.text);
      } else if (type === 'complete') {
        receivedComplete = data;
      }
    });

    assert.ok(receivedTokens.length >= 2, `Expected at least 2 progressive token chunks, got ${receivedTokens.length}`);
    assert.ok(receivedMetadata, 'Metadata event must be emitted');
    assert.strictEqual(receivedMetadata.actualModel, 'qwen2.5-coder:1.5b');
    assert.ok(receivedComplete, 'Complete event must be emitted');
    assert.strictEqual(receivedComplete.actual_model, 'qwen2.5-coder:1.5b');
    assert.strictEqual(receivedComplete.external_calls, 0);
  });

  it('Auto mode correctly classifies intent and streams from selected specialist model', async (t) => {
    if (!gatewayOnline) {
      t.skip('Gateway is offline at 127.0.0.1:8300; skipping live network SSE streaming test');
      return;
    }

    let actualAutoModel = null;
    const tokenChunks = [];

    await readSSE({
      agent_id: 'agent-101',
      task: 'def compute_discount(price, pct): return price * (1 - pct)',
      modelMode: 'auto',
      parameters: { max_tokens: 30 }
    }, (type, data) => {
      if (type === 'metadata') {
        actualAutoModel = data.actualModel;
      } else if (type === 'token') {
        tokenChunks.push(data.text);
      }
    });

    assert.ok(actualAutoModel.includes('qwen') || actualAutoModel.includes('coder'), `Auto code routing expected Qwen Coder, got ${actualAutoModel}`);
    assert.ok(tokenChunks.length > 0, 'Tokens must arrive during auto stream');
  });

  it('Stop generation aborts client stream while preserving accumulated partial tokens', async (t) => {
    if (!gatewayOnline) {
      t.skip('Gateway is offline at 127.0.0.1:8300; skipping live network SSE streaming test');
      return;
    }

    const partialTokens = [];
    let aborted = false;

    await readSSE({
      agent_id: 'agent-101',
      task: 'List numbers from 1 to 20 slowly.',
      modelMode: 'qwen',
      model_override: 'qwen2.5-coder:1.5b',
      parameters: { max_tokens: 60 }
    }, (type, data, req) => {
      if (type === 'token') {
        partialTokens.push(data.text);
        if (partialTokens.length >= 3 && !aborted) {
          aborted = true;
          req.destroy(); // Simulate client clicking Stop button
        }
      }
    }).catch(() => {
      // Expected socket destroy
    });

    assert.ok(partialTokens.length >= 2, `Partial tokens should be captured before abort, got ${partialTokens.length}`);
  });
});
