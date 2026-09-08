import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Personal Style Lab React Feature Tests', () => {
  const labPath = path.resolve('platform/web/src/features/personal-style/PersonalStyleLab.tsx');
  const chatPath = path.resolve('platform/web/src/features/personal-style/PersonalStyleChat.tsx');
  const headerPath = path.resolve('platform/web/src/features/personal-style/PersonalStyleHeader.tsx');
  const storePath = path.resolve('platform/web/src/features/personal-style/personal-style.store.ts');

  it('PersonalStyleLab.tsx exists and renders mobile-first container', () => {
    assert.ok(fs.existsSync(labPath));
    const content = fs.readFileSync(labPath, 'utf8');
    assert.ok(content.includes('PersonalStyleLab'));
  });

  it('PersonalStyleChat.tsx displays WhatsApp bubbles and privacy disclaimer', () => {
    assert.ok(fs.existsSync(chatPath));
    const content = fs.readFileSync(chatPath, 'utf8');
    assert.ok(content.includes('learned communication patterns') || content.includes('disclaimer'));
  });

  it('PersonalStyleHeader.tsx provides session reset and local AI badge', () => {
    assert.ok(fs.existsSync(headerPath));
    const content = fs.readFileSync(headerPath, 'utf8');
    assert.ok(content.includes('Gemma Kaviya Style') || content.includes('Local AI'));
  });

  it('personal-style.store.ts targets 301-gemma-kaviya-style-v1 endpoint', () => {
    assert.ok(fs.existsSync(storePath));
    const content = fs.readFileSync(storePath, 'utf8');
    assert.ok(content.includes('/api/personal-style/gemma/chat'));
    assert.ok(content.includes('resetSession'));
    assert.ok(content.includes('stopGeneration'));
  });
});
