import test from 'node:test';
import assert from 'node:assert/strict';
import { getModelById, LOCAL_MODELS } from '../../platform/models/model-registry.js';

test('Verification: Old Native Runtime Routing Removed from Active Registry', () => {
  const activeCpuModels = LOCAL_MODELS.filter(m => m.execution_target === 'CPU' && m.model_id !== 'local-vision-ocr' && m.model_id !== 'openelm-1.1b');
  
  for (const m of activeCpuModels) {
    assert.strictEqual(m.runtime_type, 'OLLAMA', `${m.name} must use OLLAMA runtime`);
    assert.notStrictEqual(m.runtime_type, 'EXECUTORCH', `${m.name} must not use EXECUTORCH`);
    assert.notStrictEqual(m.runtime_type, 'PYTORCH', `${m.name} must not use PYTORCH`);
    assert.ok(!m.endpoint.includes('8305'), `${m.name} endpoint must not point to port 8305`);
  }
});
