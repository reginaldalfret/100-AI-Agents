import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '../..');

describe('Model Arena UI View', () => {
  const htmlPath = path.join(ROOT, 'platform', 'web', 'index.html');
  const cssPath = path.join(ROOT, 'platform', 'web', 'styles.css');
  const jsPath = path.join(ROOT, 'platform', 'web', 'app.js');
  let html, css, js;
  
  it('loads all UI files', () => {
    html = fs.readFileSync(htmlPath, 'utf8');
    css = fs.readFileSync(cssPath, 'utf8');
    js = fs.readFileSync(jsPath, 'utf8');
  });
  
  // HTML tests
  it('has modelArenaView section', () => {
    assert.ok(html.includes('id="modelArenaView"'), 'Should have modelArenaView section');
  });
  
  it('has arena grid container', () => {
    assert.ok(html.includes('id="arenaGrid"'), 'Should have arenaGrid div');
  });
  
  it('has arena prompt input', () => {
    assert.ok(html.includes('id="arenaPromptInput"'), 'Should have prompt input');
  });
  
  it('has Compare All button', () => {
    assert.ok(html.includes('id="btnArenaCompare"'), 'Should have compare button');
  });
  
  it('has Stop All button', () => {
    assert.ok(html.includes('id="btnArenaStopAll"'), 'Should have stop all button');
  });
  
  it('has Clear button', () => {
    assert.ok(html.includes('id="btnArenaClear"'), 'Should have clear button');
  });
  
  it('has Research Mode toggle', () => {
    assert.ok(html.includes('id="arenaResearchMode"'), 'Should have research mode checkbox');
  });
  
  it('has back button', () => {
    assert.ok(html.includes('id="btnArenaBack"'), 'Should have back button');
  });
  
  it('has nav button for arena', () => {
    assert.ok(html.includes('id="btnModelArena"'), 'Should have nav button');
  });
  
  // CSS tests
  it('has arena grid CSS', () => {
    assert.ok(css.includes('.arena-grid'), 'Should have arena grid styles');
  });
  
  it('has arena card CSS', () => {
    assert.ok(css.includes('.arena-card'), 'Should have arena card styles');
  });
  
  it('has 4-column grid layout', () => {
    assert.ok(css.includes('repeat(4, 1fr)'), 'Should have 4-column grid');
  });
  
  it('has mobile responsive styles', () => {
    assert.ok(css.includes('max-width: 768px'), 'Should have mobile breakpoint');
  });
  
  it('has arena view container styles', () => {
    assert.ok(css.includes('.arena-view-container'), 'Should have view container styles');
  });
  
  // JS tests
  it('has arena controller in app.js', () => {
    assert.ok(js.includes('arenaGrid') || js.includes('ArenaController') || js.includes('btnArenaCompare'), 'Should have arena JS logic');
  });
  
  it('has DEFAULT_ARENA_MODELS in frontend', () => {
    assert.ok(js.includes('DEFAULT_ARENA_MODELS') || js.includes('nemotron-3-nano'), 'Should have default models list');
  });
  
  it('handles model-arena/compare endpoint', () => {
    assert.ok(js.includes('model-arena/compare'), 'Should call compare API');
  });
  
  it('handles SSE events', () => {
    assert.ok(js.includes('model_start') || js.includes('model_token') || js.includes('model_complete'), 'Should handle SSE events');
  });
  
  it('has switchMainView integration for modelArena', () => {
    assert.ok(js.includes('modelArena'), 'Should integrate with switchMainView');
  });
});
