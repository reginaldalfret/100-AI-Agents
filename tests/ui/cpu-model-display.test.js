import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('UI CPU Model Display with Official Ollama & Badges', () => {
  const indexHtml = fs.readFileSync('platform/web/index.html', 'utf8');
  const appJs = fs.readFileSync('platform/web/app.js', 'utf8');

  // Verify index.html contains all 4 CPU models
  assert.ok(indexHtml.includes('Liquid AI LFM2.5 350M'), 'LFM2.5 350M must be in index.html');
  assert.ok(indexHtml.includes('RWKV-7 0.4B'), 'RWKV-7 must be in index.html');
  assert.ok(indexHtml.includes('TinyLlama 1.1B'), 'TinyLlama 1.1B must be in index.html');
  assert.ok(indexHtml.includes('Stable LM 2 1.6B'), 'Stable LM 2 1.6B must be in index.html');

  // Verify badges
  assert.ok(indexHtml.includes('badge-extraction'), 'Extraction badge must exist');
  assert.ok(indexHtml.includes('badge-general'), 'General badge must exist');

  // Verify app.js contains the models
  assert.ok(appJs.includes('tinyllama:1.1b-chat'), 'TinyLlama in app.js');
  assert.ok(appJs.includes('stablelm2:1.6b'), 'Stable LM 2 in app.js');
});
