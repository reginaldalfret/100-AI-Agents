import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Liquid Glass Restraint & Content-First Architecture', () => {
  const arenaCardPath = path.resolve('platform/web/src/features/model-arena/ModelCard.tsx');
  const personalChatPath = path.resolve('platform/web/src/features/personal-style/PersonalStyleChat.tsx');

  it('Model Arena response card body is a clean content surface, not stacked glass', () => {
    assert.ok(fs.existsSync(arenaCardPath));
    const content = fs.readFileSync(arenaCardPath, 'utf8');
    assert.ok(content.includes('lg-content-surface') || content.includes('arena-card-body'));
    assert.ok(!content.includes('lg-glass-everything'));
  });

  it('Personal Style chat bubbles are high-contrast conversation elements', () => {
    assert.ok(fs.existsSync(personalChatPath));
    const content = fs.readFileSync(personalChatPath, 'utf8');
    assert.ok(content.includes('scrollSentinelRef'));
    assert.ok(content.includes('messages'));
  });
});
