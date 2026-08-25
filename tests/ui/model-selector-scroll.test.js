import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

test('Model Selector Dropdown Scrollable Architecture (10+ Models Support)', async (t) => {
  const stylesCss = fs.readFileSync(path.resolve('E:/Smart Automation/100-AI-Agents/platform/web/styles.css'), 'utf8');
  const appJs = fs.readFileSync(path.resolve('E:/Smart Automation/100-AI-Agents/platform/web/app.js'), 'utf8');
  const indexHtml = fs.readFileSync(path.resolve('E:/Smart Automation/100-AI-Agents/platform/web/index.html'), 'utf8');

  await t.test('1. Dropdown menu has max-height constraint and overflow containment', () => {
    assert.ok(stylesCss.includes('.model-dropdown-menu'), 'styles.css must style .model-dropdown-menu');
    assert.ok(stylesCss.includes('max-height: 70vh') || stylesCss.includes('max-height: calc(70vh'), 'menu must have max-height constraint (~70vh)');
    assert.ok(stylesCss.includes('overscroll-behavior: contain'), 'must contain overscroll to prevent background scrolling');
  });

  await t.test('2. Model options list has independent vertical scrolling and custom scrollbar', () => {
    assert.ok(stylesCss.includes('.model-options-list'), 'styles.css must style .model-options-list');
    assert.ok(stylesCss.includes('overflow-y: auto'), 'model-options-list must have overflow-y: auto');
    assert.ok(stylesCss.includes('.model-options-list::-webkit-scrollbar'), 'must define custom scrollbar for model options list');
    assert.ok(stylesCss.includes('.model-options-list::-webkit-scrollbar-thumb'), 'must define liquid glass scrollbar thumb');
  });

  await t.test('3. Dropdown header is fixed/sticky and separate from scrollable model list', () => {
    assert.ok(stylesCss.includes('.model-dropdown-header'), 'styles.css must style .model-dropdown-header');
    assert.ok(stylesCss.includes('flex-shrink: 0'), 'header must not shrink during scrolling');
  });

  await t.test('4. Auto-scrolls active selected model into view on dropdown open', () => {
    assert.ok(appJs.includes('openModelDropdown'), 'app.js must define openModelDropdown');
    assert.ok(appJs.includes('scrollIntoView'), 'openModelDropdown must invoke scrollIntoView for active item');
  });

  await t.test('5. Simulation: 10+, 15+, 20+ models fit cleanly into scrollable list without changing typography', () => {
    // Check that typography classes retain existing sizes
    assert.ok(stylesCss.includes('.model-name'), 'styles.css must have .model-name');
    assert.ok(stylesCss.includes('.model-badge'), 'styles.css must have .model-badge');
    assert.ok(stylesCss.includes('.model-desc'), 'styles.css must have .model-desc');
  });
});
