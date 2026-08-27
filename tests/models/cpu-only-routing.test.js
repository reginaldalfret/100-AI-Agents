import test from 'node:test';
import assert from 'node:assert/strict';
import { routeTaskToLocalModel } from '../../platform/models/model-router.js';

test('CPU-Only Model Routing across all 4 CPU models', async () => {
  const rLfm = await routeTaskToLocalModel({ model_override: 'lfm' });
  assert.strictEqual(rLfm.selected_model, 'lfm2.5-350m');
  assert.strictEqual(rLfm.hardware_footprint.vram_mb, 0);

  const rRwkv = await routeTaskToLocalModel({ model_override: 'rwkv' });
  assert.strictEqual(rRwkv.selected_model, 'rwkv7-0.4b');
  assert.strictEqual(rRwkv.hardware_footprint.vram_mb, 0);

  const rTiny = await routeTaskToLocalModel({ model_override: 'tinyllama' });
  assert.strictEqual(rTiny.selected_model, 'tinyllama-1.1b');
  assert.strictEqual(rTiny.hardware_footprint.vram_mb, 0);

  const rStable = await routeTaskToLocalModel({ model_override: 'stablelm' });
  assert.strictEqual(rStable.selected_model, 'stablelm2-1.6b');
  assert.strictEqual(rStable.hardware_footprint.vram_mb, 0);
});
