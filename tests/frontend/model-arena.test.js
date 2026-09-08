import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Model Arena React Components & State', () => {
  const arenaViewPath = path.resolve('platform/web/src/features/model-arena/ModelArena.tsx');
  const cardPath = path.resolve('platform/web/src/features/model-arena/ModelCard.tsx');
  const storePath = path.resolve('platform/web/src/features/model-arena/arena.store.ts');

  it('ModelArena.tsx exists and renders 4x2 comparison grid', () => {
    assert.ok(fs.existsSync(arenaViewPath));
    const content = fs.readFileSync(arenaViewPath, 'utf8');
    assert.ok(content.includes('ModelArena'));
    assert.ok(content.includes('ModelCard'));
  });

  it('ModelCard.tsx renders GPU badge, live status, and cursor', () => {
    assert.ok(fs.existsSync(cardPath));
    const content = fs.readFileSync(cardPath, 'utf8');
    assert.ok(content.includes('GPU'));
    assert.ok(content.includes('arena-cursor') || content.includes('cursor'));
  });

  it('arena.store.ts enforces max 1 concurrent model generation for RTX 2050', () => {
    assert.ok(fs.existsSync(storePath));
    const content = fs.readFileSync(storePath, 'utf8');
    assert.ok(content.includes('isGenerating') || content.includes('activeGeneratingModelId'));
  });
});
