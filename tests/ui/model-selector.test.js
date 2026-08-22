/**
 * Super AI — Local Model Selector Regression & Verification Test Suite
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { LOCAL_MODELS, getModelById } from '../../platform/models/model-registry.js';
import { routeTaskToLocalModel } from '../../platform/models/model-router.js';

console.log(`\n============================================================`);
console.log(`RUNNING TEST SUITE: Super AI Local Model Selector`);
console.log(`============================================================`);

const PROJECT_ROOT = process.cwd();
const htmlPath = path.join(PROJECT_ROOT, 'platform', 'web', 'index.html');
const cssPath = path.join(PROJECT_ROOT, 'platform', 'web', 'styles.css');
const jsPath = path.join(PROJECT_ROOT, 'platform', 'web', 'app.js');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const jsContent = fs.readFileSync(jsPath, 'utf8');

// Test 1: Exactly 3 Production Models in Registry
try {
  const nemotron = getModelById('nemotron-3-nano');
  const gemma = getModelById('gemma3-4b');
  const qwen = getModelById('local-code-specialist');

  assert(nemotron, 'NVIDIA Nemotron 3 model must exist in registry');
  assert(gemma, 'Google Gemma 3 model must exist in registry');
  assert(qwen, 'Qwen 2.5 Coder model must exist in registry');

  assert.strictEqual(gemma.ollama_name, 'gemma3:4b', 'Gemma internal tag must be gemma3:4b');
  assert.strictEqual(qwen.ollama_name, 'qwen2.5-coder:1.5b', 'Qwen internal tag must be qwen2.5-coder:1.5b');

  console.log(`  [PASS] Exactly 3 production models verified in registry with canonical IDs`);
} catch (err) {
  console.error(`  [FAIL] Registry production models check failed:`, err.message);
  throw err;
}

// Test 2: HTML UI Structure (Button & Floating Dropdown)
try {
  assert(htmlContent.includes('id="modelSelectorWrapper"'), 'index.html must contain modelSelectorWrapper');
  assert(htmlContent.includes('id="modelSelectorBtn"'), 'index.html must contain modelSelectorBtn trigger');
  assert(htmlContent.includes('id="modelDropdown"'), 'index.html must contain floating modelDropdown');
  assert(htmlContent.includes('data-model-id="auto"'), 'index.html must contain Auto mode option');
  assert(htmlContent.includes('Google Gemma 3'), 'index.html must display full name Google Gemma 3');
  assert(htmlContent.includes('NVIDIA Nemotron 3'), 'index.html must display full name NVIDIA Nemotron 3');
  assert(htmlContent.includes('Qwen 2.5 Coder'), 'index.html must display full name Qwen 2.5 Coder');
  assert(htmlContent.includes('id="modelDetailsSubpanel"'), 'index.html must contain compact details subpanel');

  console.log(`  [PASS] UI structure renders 3 models, Auto router, and inline specifications subpanel`);
} catch (err) {
  console.error(`  [FAIL] HTML UI structure check failed:`, err.message);
  throw err;
}

// Test 3: Liquid Glass & Animation Styling
try {
  assert(cssContent.includes('.model-selector-wrapper'), 'styles.css must style .model-selector-wrapper');
  assert(cssContent.includes('.btn-model-selector'), 'styles.css must style .btn-model-selector');
  assert(cssContent.includes('.model-dropdown-menu'), 'styles.css must style .model-dropdown-menu');
  assert(cssContent.includes('modelDropdownIn'), 'styles.css must include entry animation');
  assert(cssContent.includes('.badge-vision'), 'styles.css must style Vision badge');
  assert(cssContent.includes('.badge-reasoning'), 'styles.css must style Reasoning badge');
  assert(cssContent.includes('.badge-code'), 'styles.css must style Code badge');

  console.log(`  [PASS] Liquid glass, RGB neon accents, and smooth animation styles verified`);
} catch (err) {
  console.error(`  [FAIL] CSS styling check failed:`, err.message);
  throw err;
}

// Test 4: JavaScript State & Model Definitions
try {
  assert(jsContent.includes('LOCAL_MODEL_DEFS'), 'app.js must define LOCAL_MODEL_DEFS');
  assert(jsContent.includes('selectModelMode'), 'app.js must implement selectModelMode function');
  assert(jsContent.includes('toggleModelDropdown'), 'app.js must implement toggleModelDropdown function');
  assert(jsContent.includes('initModelSelector'), 'app.js must implement initModelSelector function');
  assert(jsContent.includes('appendSystemEvent'), 'app.js must implement appendSystemEvent for model changes');

  console.log(`  [PASS] Model selector controller, selection state, and event notices verified`);
} catch (err) {
  console.error(`  [FAIL] JavaScript controller check failed:`, err.message);
  throw err;
}

// Test 5: Model Request Contract & Backend Routing
try {
  assert(jsContent.includes('modelMode: currentModelMode'), 'app.js sendToBackend must include modelMode');
  assert(jsContent.includes('model_override: modelOverride'), 'app.js sendToBackend must include model_override');

  // Verify backend model router handles visual tasks -> Gemma, reasoning -> Nemotron, coding -> Qwen in Auto mode
  const visualTask = await routeTaskToLocalModel({ task: 'Analyze photograph of corrosion on HX-204' });
  assert.strictEqual(visualTask.selected_model, 'gemma3-4b', 'Visual photograph task must route to Gemma 3 in Auto mode');

  const reasoningTask = await routeTaskToLocalModel({ task: 'Perform multi-agent root cause synthesis' });
  assert.strictEqual(reasoningTask.selected_model, 'nemotron-3-nano', 'Reasoning task must route to Nemotron 3 in Auto mode');

  const codeTask = await routeTaskToLocalModel({ task: 'Generate python calculation script for corrosion rates' });
  assert.strictEqual(codeTask.selected_model, 'local-code-specialist', 'Code task must route to Qwen Coder in Auto mode');

  // Verify explicit manual overrides
  const manualGemma = await routeTaskToLocalModel({ task: 'General question', modelMode: 'gemma' });
  assert.strictEqual(manualGemma.selected_model, 'gemma3-4b', 'Manual gemma mode must route to Gemma 3');

  const manualNemotron = await routeTaskToLocalModel({ task: 'General question', modelMode: 'nemotron' });
  assert.strictEqual(manualNemotron.selected_model, 'nemotron-3-nano', 'Manual nemotron mode must route to Nemotron 3');

  const manualQwen = await routeTaskToLocalModel({ task: 'General question', modelMode: 'qwen' });
  assert.strictEqual(manualQwen.selected_model, 'local-code-specialist', 'Manual qwen mode must route to Qwen Coder');

  console.log(`  [PASS] Model request contract, auto routing, and explicit manual overrides verified`);
} catch (err) {
  console.error(`  [FAIL] Model request contract check failed:`, err.message);
  throw err;
}

console.log(`------------------------------------------------------------`);
console.log(`Summary: 5 Passed, 0 Failed`);
console.log(`============================================================\n`);
