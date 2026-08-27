import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { routeTaskToLocalModel } from '../../platform/models/model-router.js';

describe('Falcon3 1B — GPU Routing & Dispatch Suite', () => {
  it('routes explicit model_override "falcon3:1b-instruct-q4_K_M" to falcon3-1b-instruct', async () => {
    const route = await routeTaskToLocalModel({
      task: 'Calculate the trajectory acceleration of a projectile',
      model_override: 'falcon3:1b-instruct-q4_K_M'
    });
    assert.strictEqual(route.selected_model, 'falcon3-1b-instruct');
    assert.strictEqual(route.external_calls, 0);
  });

  it('routes explicit model_override "falcon3" and "falcon" shorthand', async () => {
    const route1 = await routeTaskToLocalModel({
      task: 'Explain chemical reaction rates',
      model_override: 'falcon3'
    });
    assert.strictEqual(route1.selected_model, 'falcon3-1b-instruct');

    const route2 = await routeTaskToLocalModel({
      task: 'Explain thermodynamics',
      model_override: 'falcon'
    });
    assert.strictEqual(route2.selected_model, 'falcon3-1b-instruct');
  });

  it('routes modelMode "falcon" and "falcon3" strictly to falcon3-1b-instruct', async () => {
    const route = await routeTaskToLocalModel({
      task: 'Solve quadratic equation',
      modelMode: 'falcon'
    });
    assert.strictEqual(route.selected_model, 'falcon3-1b-instruct');
  });
});
