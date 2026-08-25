import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

test('UI Model Tier Display and Data-Driven Architecture', async (t) => {
  const appJsPath = path.resolve('E:/Smart Automation/100-AI-Agents/platform/web/app.js');
  const indexHtmlPath = path.resolve('E:/Smart Automation/100-AI-Agents/platform/web/index.html');
  const stylesCssPath = path.resolve('E:/Smart Automation/100-AI-Agents/platform/web/styles.css');

  const appJs = fs.readFileSync(appJsPath, 'utf8');
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  const stylesCss = fs.readFileSync(stylesCssPath, 'utf8');

  await t.test('app.js defines execution_target for all models and includes LFM2.5', () => {
    assert.ok(appJs.includes("execution_target: 'CPU'"), 'app.js must define CPU execution target');
    assert.ok(appJs.includes("execution_target: 'GPU'"), 'app.js must define GPU execution target');
    assert.ok(appJs.includes('LFM2.5-1.2B-Instruct'), 'app.js must include LFM2.5-1.2B-Instruct');
    assert.ok(appJs.includes('Liquid AI'), 'app.js must declare Liquid AI provider');
  });

  await t.test('index.html contains separated GPU LLM and CPU LLM sections', () => {
    assert.ok(indexHtml.includes('GPU LLM MODELS'), 'index.html must contain GPU LLM MODELS section');
    assert.ok(indexHtml.includes('CPU LLM MODELS (ZERO VRAM)'), 'index.html must contain CPU LLM MODELS section');
    assert.ok(indexHtml.includes('Liquid AI LFM2.5-1.2B-Instruct'), 'index.html must contain LFM2.5 in model view');
    assert.ok(indexHtml.includes('CPU ONLY'), 'index.html must display CPU ONLY badge');
  });

  await t.test('styles.css contains styling for tier sections and badges', () => {
    assert.ok(stylesCss.includes('.badge-cpu'), 'styles.css must have .badge-cpu');
    assert.ok(stylesCss.includes('.tier-section-header'), 'styles.css must have .tier-section-header');
    assert.ok(stylesCss.includes('.tier-gpu-card'), 'styles.css must have .tier-gpu-card');
    assert.ok(stylesCss.includes('.tier-cpu-card'), 'styles.css must have .tier-cpu-card');
  });
});
