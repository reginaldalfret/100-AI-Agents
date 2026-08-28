/**
 * tests/ui/specialist-chat.test.js
 * 
 * Verifies that the specialist chat view and UI elements exist
 * and are structurally configured in platform/web/index.html.
 */

import assert from 'node:assert';
import fs from 'node:fs';

console.log('Running: tests/ui/specialist-chat.test.js');

const html = fs.readFileSync('platform/web/index.html', 'utf8');

assert.ok(html.includes('id="specialistChatView"'), 'specialistChatView section must exist');
assert.ok(html.includes('id="specialistChatTitle"'), 'specialistChatTitle element must exist');
assert.ok(html.includes('id="specChatDomain"'), 'specChatDomain element must exist');
assert.ok(html.includes('id="specialistHealthcareDisclaimer"'), 'specialistHealthcareDisclaimer banner must exist');
assert.ok(html.includes('id="specStarterChips"'), 'specStarterChips container must exist');
assert.ok(html.includes('id="specialistMessages"'), 'specialistMessages container must exist');
assert.ok(html.includes('id="specialistInput"'), 'specialistInput input box must exist');
assert.ok(html.includes('id="btnSpecialistSend"'), 'btnSpecialistSend button must exist');

console.log('✓ tests/ui/specialist-chat.test.js passed successfully.');
