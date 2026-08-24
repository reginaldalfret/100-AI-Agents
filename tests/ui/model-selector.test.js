/**
 * Super AI — Local Model Selector Regression & Verification Test Suite
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { LOCAL_MODELS, getModelById } from '../../platform/models/model-registry.js';
import { routeTaskToLocalModel } from '../../platform/models/model-router.js';

const PROJECT_ROOT = process.env.PROJECT_ROOT || 'E:\\Smart Automation\\100-AI-Agents';
const htmlPath = path.join(PROJECT_ROOT, 'platform', 'web', 'index.html');
const cssPath = path.join(PROJECT_ROOT, 'platform', 'web', 'styles.css');
const jsPath = path.join(PROJECT_ROOT, 'platform', 'web', 'app.js');

describe('Super AI Local Model Selector Test Suite', () => {
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  const jsContent = fs.readFileSync(jsPath, 'utf8');

  it('1. Verified core production models in registry with canonical IDs', () => {
    const nemotron = getModelById('nemotron-3-nano');
    const gemma = getModelById('gemma3-1b');
    const qwen = getModelById('local-code-specialist');

    assert.ok(nemotron, 'NVIDIA Nemotron 3 model must exist in registry');
    assert.ok(gemma, 'Google Gemma 3 model must exist in registry');
    assert.ok(qwen, 'Qwen 2.5 Coder model must exist in registry');

    assert.strictEqual(gemma.ollama_name, 'gemma3:1b', 'Gemma internal tag must be gemma3:1b');
    assert.strictEqual(qwen.ollama_name, 'qwen2.5-coder:1.5b', 'Qwen internal tag must be qwen2.5-coder:1.5b');
  });

  it('2. HTML UI structure renders models, Auto router, and inline specifications subpanel', () => {
    assert.ok(htmlContent.includes('id="modelSelectorWrapper"'), 'index.html must contain modelSelectorWrapper');
    assert.ok(htmlContent.includes('id="modelSelectorBtn"'), 'index.html must contain modelSelectorBtn trigger');
    assert.ok(htmlContent.includes('id="modelDropdown"'), 'index.html must contain floating modelDropdown');
    assert.ok(htmlContent.includes('data-model-id="auto"'), 'index.html must contain Auto mode option');
    assert.ok(htmlContent.includes('Google Gemma 3'), 'index.html must display full name Google Gemma 3');
    assert.ok(htmlContent.includes('NVIDIA Nemotron 3'), 'index.html must display full name NVIDIA Nemotron 3');
    assert.ok(htmlContent.includes('Qwen 2.5 Coder'), 'index.html must display full name Qwen 2.5 Coder');
    assert.ok(htmlContent.includes('id="modelDetailsSubpanel"'), 'index.html must contain compact details subpanel');
  });

  it('3. Liquid glass, RGB neon accents, and smooth animation styles verified', () => {
    assert.ok(cssContent.includes('.model-selector-wrapper'), 'styles.css must style .model-selector-wrapper');
    assert.ok(cssContent.includes('.btn-model-selector'), 'styles.css must style .btn-model-selector');
    assert.ok(cssContent.includes('.model-dropdown-menu'), 'styles.css must style .model-dropdown-menu');
    assert.ok(cssContent.includes('modelDropdownIn'), 'styles.css must include entry animation');
    assert.ok(cssContent.includes('.badge-vision'), 'styles.css must style Vision badge');
    assert.ok(cssContent.includes('.badge-reasoning'), 'styles.css must style Reasoning badge');
    assert.ok(cssContent.includes('.badge-code'), 'styles.css must style Code badge');
  });

  it('4. Model selector controller, selection state, and event notices verified', () => {
    assert.ok(jsContent.includes('LOCAL_MODEL_DEFS'), 'app.js must define LOCAL_MODEL_DEFS');
    assert.ok(jsContent.includes('selectModelMode'), 'app.js must implement selectModelMode function');
    assert.ok(jsContent.includes('toggleModelDropdown'), 'app.js must implement toggleModelDropdown function');
    assert.ok(jsContent.includes('initModelSelector'), 'app.js must implement initModelSelector function');
    assert.ok(jsContent.includes('appendSystemEvent'), 'app.js must implement appendSystemEvent for model changes');
  });

  it('5. Model request contract, auto routing, and explicit manual overrides verified', async () => {
    assert.ok(jsContent.includes('modelMode: currentModelMode'), 'app.js sendToBackend must include modelMode');
    assert.ok(jsContent.includes('model_override: modelOverride'), 'app.js sendToBackend must include model_override');

    // Verify backend model router handles OCR tasks -> local-vision-ocr, reasoning -> Nemotron, coding -> Qwen in Auto mode
    const ocrTask = await routeTaskToLocalModel({ prompt: 'Perform OCR scan extraction on scanned maintenance work order PDF' });
    assert.strictEqual(ocrTask.selected_model, 'local-vision-ocr', 'Scanned document task must route to OCR engine in Auto mode');

    const reasoningTask = await routeTaskToLocalModel({ task: 'Perform multi-agent root cause synthesis' });
    assert.strictEqual(reasoningTask.selected_model, 'nemotron-3-nano', 'Reasoning task must route to Nemotron 3 in Auto mode');

    const codeTask = await routeTaskToLocalModel({ task: 'Generate python calculation script for corrosion rates' });
    assert.strictEqual(codeTask.selected_model, 'local-code-specialist', 'Code task must route to Qwen Coder in Auto mode');

    // Verify explicit manual overrides
    const manualGemma = await routeTaskToLocalModel({ task: 'General question', modelMode: 'gemma' });
    assert.strictEqual(manualGemma.selected_model, 'gemma3-1b', 'Manual gemma mode must route to Gemma 3 1B');

    const manualNemotron = await routeTaskToLocalModel({ task: 'General question', modelMode: 'nemotron' });
    assert.strictEqual(manualNemotron.selected_model, 'nemotron-3-nano', 'Manual nemotron mode must route to Nemotron 3');

    const manualQwen = await routeTaskToLocalModel({ task: 'General question', modelMode: 'qwen' });
    assert.strictEqual(manualQwen.selected_model, 'local-code-specialist', 'Manual qwen mode must route to Qwen Coder');
  });
});
