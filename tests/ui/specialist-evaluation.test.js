/**
 * tests/ui/specialist-evaluation.test.js
 * 
 * Verifies that the Step 8 Evaluation and Step 9 Publish UI panels
 * contain the dynamic comparison cards, badges, and technical details accordion.
 */

import assert from 'node:assert';
import fs from 'node:fs';

console.log('Running: tests/ui/specialist-evaluation.test.js');

const html = fs.readFileSync('platform/web/index.html', 'utf8');

assert.ok(html.includes('id="ftEvalBaseHeader"'), 'ftEvalBaseHeader must exist in step 8');
assert.ok(html.includes('id="ftEvalTunedHeader"'), 'ftEvalTunedHeader must exist in step 8');
assert.ok(html.includes('id="ftFinalSpecialistTitle"'), 'ftFinalSpecialistTitle must exist in step 9');
assert.ok(html.includes('id="btnToggleTechDetails"'), 'btnToggleTechDetails button must exist');
assert.ok(html.includes('id="techDetailsContent"'), 'techDetailsContent box must exist');
assert.ok(html.includes('id="techOllamaTag"'), 'techOllamaTag element must exist');

console.log('✓ tests/ui/specialist-evaluation.test.js passed successfully.');
