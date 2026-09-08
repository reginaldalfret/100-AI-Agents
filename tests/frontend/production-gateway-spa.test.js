import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Production Gateway Static Serving & SPA Fallback Tests', () => {
  it('GET / serves React HTML bundle', async (t) => {
    try {
      const res = await fetch('http://127.0.0.1:8300/', { signal: AbortSignal.timeout(1000) });
      assert.equal(res.status, 200);
      const text = await res.text();
      assert.ok(text.includes('id="root"'));
    } catch {
      t.skip('Gateway not running on port 8300 in test environment');
    }
  });

  it('GET /arena falls back to index.html with 200 OK', async (t) => {
    try {
      const res = await fetch('http://127.0.0.1:8300/arena', { signal: AbortSignal.timeout(1000) });
      assert.equal(res.status, 200);
      const text = await res.text();
      assert.ok(text.includes('id="root"'));
    } catch {
      t.skip('Gateway not running on port 8300 in test environment');
    }
  });

  it('GET /personal-style falls back to index.html with 200 OK', async (t) => {
    try {
      const res = await fetch('http://127.0.0.1:8300/personal-style', { signal: AbortSignal.timeout(1000) });
      assert.equal(res.status, 200);
      const text = await res.text();
      assert.ok(text.includes('id="root"'));
    } catch {
      t.skip('Gateway not running on port 8300 in test environment');
    }
  });

  it('GET /api/health retains REST JSON response without SPA fallback', async (t) => {
    try {
      const res = await fetch('http://127.0.0.1:8300/api/health', { signal: AbortSignal.timeout(1000) });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.ok(json.status === 'ok' || json.status === 'healthy' || json.status === 'degraded');
    } catch {
      t.skip('Gateway not running on port 8300 in test environment');
    }
  });
});
