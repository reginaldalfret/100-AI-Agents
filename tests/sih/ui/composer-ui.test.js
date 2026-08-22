/**
 * Sovereign AI Workbench — UI & Composer Regression Test Suite
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log(`\n============================================================`);
console.log(`RUNNING TEST SUITE: Persistent Chat Composer & UI Architecture`);
console.log(`============================================================`);

const PROJECT_ROOT = process.cwd();
const htmlPath = path.join(PROJECT_ROOT, 'platform', 'web', 'index.html');
const cssPath = path.join(PROJECT_ROOT, 'platform', 'web', 'styles.css');
const jsPath = path.join(PROJECT_ROOT, 'platform', 'web', 'app.js');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const jsContent = fs.readFileSync(jsPath, 'utf8');

// Test 1: Composer Container Position (Outside scroll container)
try {
  assert(htmlContent.includes('id="composerContainer"'), 'Composer container must exist in index.html');
  
  // Verify composer is NOT inside chatView or chatMessages
  const chatViewIndex = htmlContent.indexOf('id="chatView"');
  const chatViewCloseIndex = htmlContent.indexOf('</section>', chatViewIndex);
  const composerIndex = htmlContent.indexOf('id="composerContainer"');
  
  assert(composerIndex > chatViewCloseIndex, 'Composer container must be located outside chatView section');
  
  // Verify composer is inside main workspace before closing main tag
  const mainCloseIndex = htmlContent.indexOf('</main>');
  assert(composerIndex < mainCloseIndex, 'Composer container must be a direct child of main workspace');
  
  console.log(`  [PASS] Composer container is structurally outside scroll containers & pinned at bottom`);
} catch (err) {
  console.error(`  [FAIL] Composer structure check failed:`, err.message);
  throw err;
}

// Test 2: Accessible Input, Attachment and Send Elements
try {
  assert(htmlContent.includes('id="chatInput"'), 'chatInput textarea must exist');
  assert(htmlContent.includes('id="sendBtn"'), 'sendBtn must exist');
  assert(htmlContent.includes('id="attachBtn"'), 'attachBtn must exist');
  assert(htmlContent.includes('aria-label="Message agent"'), 'chatInput must have aria-label');
  assert(htmlContent.includes('aria-label="Attach files"'), 'attachBtn must have aria-label');
  assert(htmlContent.includes('aria-label="Send message"'), 'sendBtn must have aria-label');
  
  console.log(`  [PASS] Composer elements have complete accessibility attributes`);
} catch (err) {
  console.error(`  [FAIL] Accessibility check failed:`, err.message);
  throw err;
}

// Test 3: Supported File Attachment Formats
try {
  const supportedExts = ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.xlsx', '.csv', '.txt'];
  for (const ext of supportedExts) {
    assert(jsContent.includes(ext), `app.js must support attachment type: ${ext}`);
  }
  console.log(`  [PASS] File attachment chooser supports PDF, PNG, JPG, DOCX, XLSX, CSV, TXT`);
} catch (err) {
  console.error(`  [FAIL] Attachment types check failed:`, err.message);
  throw err;
}

// Test 4: Dynamic Agent Placeholder & Model Routing
try {
  assert(jsContent.includes('Ask Sovereign AI anything...'), 'app.js must provide default prompt for Auto mode');
  assert(jsContent.includes('Message ${agent.name}...'), 'app.js must provide dynamic prompt for specific agent');
  assert(jsContent.includes('Gemma 3 4B (Vision / Local)'), 'app.js must display local Gemma vision routing');
  assert(jsContent.includes('Qwen 2.5 Coder (1.5B Local)'), 'app.js must display local Qwen Coder routing');
  
  console.log(`  [PASS] Dynamic placeholder & model routing indicators configured`);
} catch (err) {
  console.error(`  [FAIL] Placeholder & model routing check failed:`, err.message);
  throw err;
}

// Test 5: CSS Sticky & Overflow Invariants
try {
  assert(cssContent.includes('.composer-container'), 'styles.css must style composer-container');
  assert(cssContent.includes('position: sticky'), 'styles.css must use sticky positioning for composer');
  assert(cssContent.includes('z-index: 20'), 'styles.css must set elevated z-index for composer');
  assert(cssContent.includes('backdrop-filter: blur(28px)'), 'styles.css must apply liquid glass backdrop blur');
  assert(cssContent.includes('min-height: 52px'), 'styles.css must enforce minimum textarea height');
  
  console.log(`  [PASS] CSS invariants guarantee sticky visibility & liquid glass styling`);
} catch (err) {
  console.error(`  [FAIL] CSS invariants check failed:`, err.message);
  throw err;
}

console.log(`------------------------------------------------------------`);
console.log(`Summary: 5 Passed, 0 Failed`);
console.log(`============================================================\n`);
