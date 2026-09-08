import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

test('Personal Style Lab — Complete View Routing and Isolation Tests', async (t) => {
  const html = fs.readFileSync(path.join(ROOT, 'platform', 'web', 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'platform', 'web', 'styles.css'), 'utf8');
  const appJs = fs.readFileSync(path.join(ROOT, 'platform', 'web', 'app.js'), 'utf8');

  await t.test('1. index.html: personalStyleView is an independent sibling view in content-area', () => {
    assert.ok(html.includes('id="personalStyleView"'), 'personalStyleView missing');
    assert.ok(html.includes('id="navPersonalStyleBtn"'), 'navPersonalStyleBtn missing');
    
    const contentAreaIndex = html.indexOf('class="content-area"');
    const personalStyleIndex = html.indexOf('id="personalStyleView"');
    const composerIndex = html.indexOf('id="composerContainer"');
    
    assert.ok(contentAreaIndex !== -1, 'content-area not found');
    assert.ok(personalStyleIndex > contentAreaIndex, 'personalStyleView must be inside content-area');
    assert.ok(personalStyleIndex < composerIndex, 'personalStyleView must be before composerContainer');
    
    const sectionStart = html.indexOf('<section id="personalStyleView"');
    const sectionEnd = html.indexOf('</section>', sectionStart);
    const personalSection = html.slice(sectionStart, sectionEnd);

    assert.ok(personalSection.includes('id="psChatInput"'), 'Must have psChatInput');
    assert.ok(!personalSection.includes('id="composerContainer"'), 'Must NOT contain nested composerContainer');
    assert.ok(!personalSection.includes('id="agentHeader"'), 'Must NOT contain nested agentHeader');
  });

  await t.test('2. app.js: elements.views registers personalStyleView', () => {
    assert.ok(appJs.includes("'personalStyle': getEl('personalStyleView')") || appJs.includes("'personalStyleView': getEl('personalStyleView')"), 'elements.views must register personalStyleView');
  });

  await t.test('3. app.js: switchMainView hides agentHeader and composerContainer on personalStyleView', () => {
    assert.ok(appJs.includes('personalStyleView'), 'switchMainView must check personalStyleView');
    assert.ok(appJs.includes("headerEl.style.display = 'none'"), 'switchMainView must hide headerEl');
    assert.ok(appJs.includes("composer.style.display = 'none'"), 'switchMainView must hide composer');
  });

  await t.test('4. app.js: Back button restores agent-workspace or chatView', () => {
    assert.ok(appJs.includes('btnPsBack'), 'btnPsBack listener missing');
    assert.ok(appJs.includes("switchMainView('agent-workspace')") || appJs.includes("switchMainView('chatView')"), 'btnPsBack must call switchMainView');
  });

  await t.test('5. styles.css: ps-chat-view-container is properly toggleable', () => {
    assert.ok(css.includes('.ps-chat-view-container'), 'ps-chat-view-container class missing');
    assert.ok(css.includes('.ps-chat-view-container.active'), 'active styling missing');
  });
});
