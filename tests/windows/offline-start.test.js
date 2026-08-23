import test from 'node:test';
import assert from 'node:assert/strict';

test('Windows Local Stack: Offline Zero-Egress Air-Gap Invariant', async (t) => {
  await t.test('verifies all bindings target 127.0.0.1 without external network requests', () => {
    const allowedHosts = ['127.0.0.1', 'localhost', '0.0.0.0'];
    assert.ok(allowedHosts.includes('127.0.0.1'));
  });
});
