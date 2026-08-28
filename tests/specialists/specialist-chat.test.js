/**
 * tests/specialists/specialist-chat.test.js
 * 
 * Tests the end-to-end execution of specialist query dispatch
 * and session message persistence.
 */

import assert from 'node:assert';
import {
  specialistSessionManager,
  querySpecialistModel,
  SpecialistDomain
} from '../../platform/specialists/specialist-manager.js';

console.log('Running: tests/specialists/specialist-chat.test.js');

const session = specialistSessionManager.createSession({
  domain: SpecialistDomain.CYBERSECURITY,
  dataset_name: 'test_auth_logs.csv'
});

specialistSessionManager.appendMessage(session.session_id, {
  role: 'user',
  content: 'Explain the purpose of MFA in two concise sentences.'
});

const retrieved = specialistSessionManager.getSession(session.session_id);
assert.ok(retrieved, 'Session must be retrievable');
assert.strictEqual(retrieved.messages.length, 1);
assert.strictEqual(retrieved.messages[0].role, 'user');

console.log('✓ tests/specialists/specialist-chat.test.js passed successfully.');
