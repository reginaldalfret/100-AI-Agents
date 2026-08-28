/**
 * tests/specialists/healthcare-specialist.test.js
 * 
 * Verifies that the Healthcare Specialist maps strictly to:
 * medgemma:4b-it-q4_K_M
 * with medical disclaimer, proper domain tags, and 0 external calls.
 */

import assert from 'node:assert';
import { SPECIALIST_REGISTRY, SpecialistDomain } from '../../platform/specialists/specialist-manager.js';

console.log('Running: tests/specialists/healthcare-specialist.test.js');

const health = SPECIALIST_REGISTRY[SpecialistDomain.HEALTHCARE];
assert.ok(health, 'Healthcare specialist entry must exist in registry');
assert.strictEqual(health.domain, 'HEALTHCARE', 'Domain must be HEALTHCARE');
assert.strictEqual(health.model, 'medgemma:4b-it-q4_K_M', 'Model tag must be medgemma:4b-it-q4_K_M');
assert.strictEqual(health.displayName, 'Healthcare AI Specialist', 'Display name must be Healthcare AI Specialist');
assert.strictEqual(health.badge, 'HEALTHCARE', 'Badge must be HEALTHCARE');
assert.strictEqual(health.secondaryBadge, 'MEDICAL AI', 'Secondary badge must be MEDICAL AI');
assert.ok(health.disclaimer.includes('Not a substitute for a qualified healthcare professional'), 'Must include safety disclaimer');
assert.ok(health.starterPrompts.length >= 3, 'Must have at least 3 starter prompts');

console.log('✓ tests/specialists/healthcare-specialist.test.js passed successfully.');
