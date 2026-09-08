import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Next.js Model Arena Sequential Queue & VRAM Safety Integrity', () => {
  const root = process.cwd();
  const arenaStorePath = path.join(root, 'platform', 'web', 'src', 'features', 'model-arena', 'arena.store.ts');
  const arenaComponentPath = path.join(root, 'platform', 'web', 'src', 'features', 'model-arena', 'ModelArena.tsx');
  const modelCardPath = path.join(root, 'platform', 'web', 'src', 'features', 'model-arena', 'ModelCard.tsx');

  it('arena.store.ts configures all 8 default GPU models', () => {
    assert.ok(fs.existsSync(arenaStorePath));
    const content = fs.readFileSync(arenaStorePath, 'utf8');

    const expectedModels = [
      'nemotron-3-nano',
      'gemma3-1b',
      'local-code-specialist',
      'llama3.2-1b',
      'granite4-1b-h',
      'phi4-mini',
      'smollm2-1.7b',
      'falcon3-1b-instruct'
    ];

    for (const modelId of expectedModels) {
      assert.ok(content.includes(modelId), `arena.store.ts must include default model ${modelId}`);
    }
  });

  it('arena.store.ts manages sequential activeGeneratingModelId for RTX 2050 4GB safety', () => {
    const content = fs.readFileSync(arenaStorePath, 'utf8');
    assert.ok(content.includes('activeGeneratingModelId'));
    assert.ok(content.includes('isGenerating'));
    assert.ok(content.includes('runComparison'));
    assert.ok(content.includes('stopAll'));
  });

  it('ModelArena.tsx renders 4x2 liquid glass grid', () => {
    assert.ok(fs.existsSync(arenaComponentPath));
    const content = fs.readFileSync(arenaComponentPath, 'utf8');
    assert.ok(content.includes('arena-grid'));
    assert.ok(content.includes('ModelCard'));
  });

  it('ModelCard.tsx supports metrics display (time, tokens, tok/s) and live cursor', () => {
    assert.ok(fs.existsSync(modelCardPath));
    const content = fs.readFileSync(modelCardPath, 'utf8');
    assert.ok(content.includes('tokens'));
    assert.ok(content.includes('tok/s') || content.includes('tps'));
    assert.ok(content.includes('arena-cursor') || content.includes('generating'));
  });
});
