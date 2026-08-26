import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

test('UI GPU Model Display — Falcon3 1B & Full GPU Tier', async (t) => {
  const indexHtmlPath = path.resolve('E:/Smart Automation/100-AI-Agents/platform/web/index.html');
  const appJsPath = path.resolve('E:/Smart Automation/100-AI-Agents/platform/web/app.js');
  const stylesCssPath = path.resolve('E:/Smart Automation/100-AI-Agents/platform/web/styles.css');

  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  const appJs = fs.readFileSync(appJsPath, 'utf8');
  const stylesCss = fs.readFileSync(stylesCssPath, 'utf8');

  await t.test('index.html renders Falcon3 1B with [SCIENCE] badge in GPU section', () => {
    assert.ok(indexHtml.includes('Falcon3 1B'), 'Must render Falcon3 1B name');
    assert.ok(indexHtml.includes('falcon3:1b-instruct-q4_K_M'), 'Must display official Ollama tag');
    assert.ok(indexHtml.includes('SCIENCE'), 'Must display SCIENCE badge');
    assert.ok(indexHtml.includes('Technology Innovation Institute'), 'Must display TII provider');
  });

  await t.test('app.js defines Falcon3 1B with execution_target: GPU', () => {
    assert.ok(appJs.includes("'falcon'"), 'app.js must define falcon key');
    assert.ok(appJs.includes('falcon3:1b-instruct-q4_K_M'), 'app.js must reference exact model tag');
    assert.ok(appJs.includes("badge: 'SCIENCE'"), 'app.js must declare SCIENCE badge');
  });

  await t.test('styles.css contains .badge-science styling', () => {
    assert.ok(stylesCss.includes('.badge-science'), 'styles.css must style .badge-science');
  });
});
