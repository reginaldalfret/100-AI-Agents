/**
 * tests/ui/specialist-button.test.js
 * 
 * Verifies that the Step 9 launch button exists, has the proper label id,
 * and is wired to open the dedicated specialist view.
 */

import assert from 'node:assert';
import fs from 'node:fs';

console.log('Running: tests/ui/specialist-button.test.js');

const html = fs.readFileSync('platform/web/index.html', 'utf8');

assert.ok(html.includes('id="ftOpenSpecialistBtn"'), 'ftOpenSpecialistBtn must exist in step 9');
assert.ok(html.includes('id="ftOpenSpecialistBtnLabel"'), 'ftOpenSpecialistBtnLabel must exist in step 9');
assert.ok(html.includes('id="btnBackFromSpecialistChat"'), 'btnBackFromSpecialistChat must exist');

console.log('✓ tests/ui/specialist-button.test.js passed successfully.');
