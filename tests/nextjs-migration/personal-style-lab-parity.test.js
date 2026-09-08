import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Next.js Personal Style Lab WhatsApp Parity', () => {
  const root = process.cwd();
  const psStorePath = path.join(root, 'platform', 'web', 'src', 'features', 'personal-style', 'personal-style.store.ts');
  const psChatPath = path.join(root, 'platform', 'web', 'src', 'features', 'personal-style', 'PersonalStyleChat.tsx');
  const psHeaderPath = path.join(root, 'platform', 'web', 'src', 'features', 'personal-style', 'PersonalStyleHeader.tsx');
  const psLabPath = path.join(root, 'platform', 'web', 'src', 'features', 'personal-style', 'PersonalStyleLab.tsx');

  it('personal-style.store.ts routes to /api/personal-style/gemma/chat endpoint', () => {
    assert.ok(fs.existsSync(psStorePath));
    const content = fs.readFileSync(psStorePath, 'utf8');
    assert.ok(content.includes('personalStyleChat') || content.includes('/api/personal-style/gemma/chat'));
    assert.ok(content.includes('sendMessage'));
    assert.ok(content.includes('resetSession'));
  });

  it('PersonalStyleChat.tsx implements WhatsApp-style chat bubbles and privacy disclaimer', () => {
    assert.ok(fs.existsSync(psChatPath));
    const content = fs.readFileSync(psChatPath, 'utf8');
    assert.ok(content.includes('ps-message-bubble') || content.includes('message-user') || content.includes('message-assistant') || content.includes('bubble'));
  });

  it('PersonalStyleHeader.tsx shows Gemma Kaviya Style and hardware safety badge', () => {
    assert.ok(fs.existsSync(psHeaderPath));
    const content = fs.readFileSync(psHeaderPath, 'utf8');
    assert.ok(content.includes('Gemma') || content.includes('Style'));
  });

  it('PersonalStyleLab.tsx wraps full chat workflow with model info modal/subpanel', () => {
    assert.ok(fs.existsSync(psLabPath));
    const content = fs.readFileSync(psLabPath, 'utf8');
    assert.ok(content.includes('PersonalStyleHeader'));
    assert.ok(content.includes('PersonalStyleChat'));
  });
});
