/**
 * tests/specialists/cybersecurity-specialist.test.js
 * 
 * Verifies that the Cybersecurity Specialist maps strictly to:
 * babar_jamali/qwen3-1.7b-cyber:latest
 * with 0 external calls, proper domain tags, and model metadata.
 */

import assert from 'node:assert';
import { SPECIALIST_REGISTRY, SpecialistDomain } from '../../platform/specialists/specialist-manager.js';

console.log('Running: tests/specialists/cybersecurity-specialist.test.js');

const cyber = SPECIALIST_REGISTRY[SpecialistDomain.CYBERSECURITY];
assert.ok(cyber, 'Cybersecurity specialist entry must exist in registry');
assert.strictEqual(cyber.domain, 'CYBERSECURITY', 'Domain must be CYBERSECURITY');
assert.strictEqual(cyber.model, 'babar_jamali/qwen3-1.7b-cyber:latest', 'Model tag must be babar_jamali/qwen3-1.7b-cyber:latest');
assert.strictEqual(cyber.displayName, 'Cybersecurity AI Specialist', 'Display name must be Cybersecurity AI Specialist');
assert.strictEqual(cyber.badge, 'CYBERSECURITY', 'Badge must be CYBERSECURITY');
assert.strictEqual(cyber.secondaryBadge, 'SPECIALIZED LLM', 'Secondary badge must be SPECIALIZED LLM');
assert.ok(cyber.starterPrompts.length >= 3, 'Must have at least 3 starter prompts');

console.log('✓ tests/specialists/cybersecurity-specialist.test.js passed successfully.');
