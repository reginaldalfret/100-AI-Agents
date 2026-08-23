import test from 'node:test';
import assert from 'node:assert/strict';
import { getServiceRegistry } from '../../platform/services/registry.js';

test('Windows Local Stack: Service Registry Schema', async (t) => {
  await t.test('registry specifies Ollama, Python Compute, and Node Gateway with strict priority', () => {
    const reg = getServiceRegistry();
    assert.ok(reg.services.ollama);
    assert.ok(reg.services.python_compute);
    assert.ok(reg.services.node_gateway);
    assert.equal(reg.services.ollama.startup_priority, 1);
    assert.equal(reg.services.python_compute.startup_priority, 2);
    assert.equal(reg.services.node_gateway.startup_priority, 3);
    assert.equal(reg.air_gapped, true);
    assert.equal(reg.external_calls, 0);
  });
});
