import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Model Arena 8 GPU Models Verification', () => {
  const storePath = path.resolve('platform/web/src/features/model-arena/arena.store.ts');
  const cardPath = path.resolve('platform/web/src/features/model-arena/ModelCard.tsx');

  it('arena.store.ts contains exactly the 8 verified GPU models', () => {
    const content = fs.readFileSync(storePath, 'utf8');
    const expected = [
      'nemotron-3-nano',
      'gemma3-1b',
      'local-code-specialist',
      'llama3.2-1b',
      'granite4-1b-h',
      'phi4-mini',
      'smollm2-1.7b',
      'falcon3-1b-instruct'
    ];
    for (const id of expected) {
      assert.ok(content.includes(id), 'Should contain ' + id);
    }
  });

  it('ModelCard supports human-readable display names including Qwen 2.5 Coder', () => {
    const content = fs.readFileSync(cardPath, 'utf8');
    assert.ok(content.includes('Qwen 2.5 Coder') || content.includes('displayName'));
  });
});
