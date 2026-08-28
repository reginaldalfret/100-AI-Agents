/**
 * tests/specialists/specialist-routing.test.js
 * 
 * Verifies that the Two-Domain Specialist routing correctly routes:
 * 1. domain='cybersecurity' -> babar_jamali/qwen3-1.7b-cyber:latest
 * 2. domain='healthcare' -> medgemma:4b-it-q4_K_M
 * And strictly rejects cross-routing or invalid domains.
 */

import assert from 'node:assert';
import { SPECIALIST_REGISTRY, SpecialistDomain } from '../../platform/specialists/specialist-manager.js';

console.log('Running: tests/specialists/specialist-routing.test.js');

// 1. Verify exact two domains only
const domains = Object.keys(SPECIALIST_REGISTRY);
assert.strictEqual(domains.length, 2, 'Must contain exactly 2 domain specialists');
assert.ok(domains.includes('cybersecurity'), 'Must contain cybersecurity');
assert.ok(domains.includes('healthcare'), 'Must contain healthcare');

// 2. Verify no cross-routing
assert.notStrictEqual(
  SPECIALIST_REGISTRY[SpecialistDomain.CYBERSECURITY].model,
  SPECIALIST_REGISTRY[SpecialistDomain.HEALTHCARE].model,
  'Specialist models must never be identical'
);

assert.strictEqual(
  SPECIALIST_REGISTRY[SpecialistDomain.CYBERSECURITY].model.includes('cyber'),
  true,
  'Cybersecurity domain must route to cyber model'
);

assert.strictEqual(
  SPECIALIST_REGISTRY[SpecialistDomain.HEALTHCARE].model.includes('medgemma'),
  true,
  'Healthcare domain must route to MedGemma model'
);

console.log('✓ tests/specialists/specialist-routing.test.js passed successfully.');
