import test from 'node:test';
import assert from 'node:assert/strict';
import { routeTaskToLocalModel } from '../../platform/models/model-router.js';

test('Ollama GGUF Model Routing', async () => {
  const rLfm = await routeTaskToLocalModel({ model_override: 'lfm' });
  assert.strictEqual(rLfm.selected_model, 'lfm2.5-350m');
  assert.strictEqual(rLfm.hardware_footprint.vram_mb, 0);

  const rRwkv = await routeTaskToLocalModel({ model_override: 'rwkv' });
  assert.strictEqual(rRwkv.selected_model, 'rwkv7-0.4b');
  assert.strictEqual(rRwkv.hardware_footprint.vram_mb, 0);
});
