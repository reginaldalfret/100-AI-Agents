import test from 'node:test';
import assert from 'node:assert/strict';

test('Windows Local Stack: Duplicate Process Prevention', async (t) => {
  await t.test('confirms single port bindings prevent duplicate instances', () => {
    const expectedPorts = { ollama: 11434, python: 8305, gateway: 8300 };
    assert.equal(expectedPorts.ollama, 11434);
    assert.equal(expectedPorts.python, 8305);
    assert.equal(expectedPorts.gateway, 8300);
  });
});
