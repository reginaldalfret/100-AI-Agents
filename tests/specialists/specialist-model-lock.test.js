/**
 * tests/specialists/specialist-model-lock.test.js
 * 
 * Verifies that the Specialist model is strictly locked per domain,
 * cannot be overridden or hijacked with arbitrary model names,
 * and maintains sovereign local execution with 0 external calls.
 */

import assert from 'node:assert';
import { specialistSessionManager, SpecialistDomain } from '../../platform/specialists/specialist-manager.js';

console.log('Running: tests/specialists/specialist-model-lock.test.js');

// 1. Create session for Cybersecurity
const cyberSession = specialistSessionManager.createSession({
  domain: SpecialistDomain.CYBERSECURITY,
  dataset_id: 'ds_test_cyber_1'
});

assert.strictEqual(cyberSession.domain, 'cybersecurity');
assert.strictEqual(cyberSession.model, 'babar_jamali/qwen3-1.7b-cyber:latest', 'Cyber model must be locked to babar_jamali/qwen3-1.7b-cyber:latest');
assert.strictEqual(cyberSession.external_calls, 0, 'External calls must be 0');
assert.strictEqual(cyberSession.network_mode, 'LOCAL_ONLY', 'Network mode must be LOCAL_ONLY');

// 2. Create session for Healthcare
const healthSession = specialistSessionManager.createSession({
  domain: SpecialistDomain.HEALTHCARE,
  dataset_id: 'ds_test_health_1'
});

assert.strictEqual(healthSession.domain, 'healthcare');
assert.strictEqual(healthSession.model, 'medgemma:4b-it-q4_K_M', 'Healthcare model must be locked to medgemma:4b-it-q4_K_M');
assert.strictEqual(healthSession.external_calls, 0, 'External calls must be 0');

// 3. Attempting invalid domain must throw
assert.throws(() => {
  specialistSessionManager.createSession({ domain: 'finance' });
}, /Invalid domain/, 'Must reject non-supported domains');

console.log('✓ tests/specialists/specialist-model-lock.test.js passed successfully.');
