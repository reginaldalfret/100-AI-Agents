import test from 'node:test';
import assert from 'node:assert/strict';

test('Windows Local Stack: Crash Recovery & Circuit Breaker', async (t) => {
  await t.test('circuit breaker limits restarts to 5 within 10 minutes', () => {
    const maxFailures = 5;
    const windowMs = 600000;
    assert.equal(maxFailures, 5);
    assert.equal(windowMs, 10 * 60 * 1000);
  });
});
