import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

test('UI CPU Model Display with 5 Models & Custom Badges', async (t) => {
  const indexHtml = fs.readFileSync(path.resolve('E:/Smart Automation/100-AI-Agents/platform/web/index.html'), 'utf8');
  const appJs = fs.readFileSync(path.resolve('E:/Smart Automation/100-AI-Agents/platform/web/app.js'), 'utf8');
  const stylesCss = fs.readFileSync(path.resolve('E:/Smart Automation/100-AI-Agents/platform/web/styles.css'), 'utf8');

  await t.test('index.html renders all 5 CPU models in #cpuModelsGrid', () => {
    assert.ok(indexHtml.includes('Liquid AI LFM2.5 350M'));
    assert.ok(indexHtml.includes('RWKV-7 0.4B'));
    assert.ok(indexHtml.includes('Meta MobileLLM-Pro 1B'));
    assert.ok(indexHtml.includes('Meta MobileLLM 350M'));
    assert.ok(indexHtml.includes('Apple OpenELM 450M'));
  });

  await t.test('index.html renders badges [EXTRACTION], [TEXT], [ASSISTANT], [EDGE]', () => {
    assert.ok(indexHtml.includes('badge-extraction'));
    assert.ok(indexHtml.includes('badge-assistant'));
    assert.ok(indexHtml.includes('badge-edge'));
    assert.ok(indexHtml.includes('badge-text'));
  });

  await t.test('app.js defines all 5 CPU models in LOCAL_MODEL_DEFS', () => {
    assert.ok(appJs.includes('LFM2.5-350M'));
    assert.ok(appJs.includes('RWKV-7 0.4B'));
    assert.ok(appJs.includes('MobileLLM-Pro 1B'));
    assert.ok(appJs.includes('MobileLLM 350M'));
    assert.ok(appJs.includes('OpenELM 450M'));
  });

  await t.test('styles.css contains styling for custom CPU badges and scrollable dropdown', () => {
    assert.ok(stylesCss.includes('.badge-extraction'));
    assert.ok(stylesCss.includes('.badge-assistant'));
    assert.ok(stylesCss.includes('.badge-edge'));
    assert.ok(stylesCss.includes('max-height: 70vh'));
  });
});
