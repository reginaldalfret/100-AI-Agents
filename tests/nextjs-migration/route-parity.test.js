import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Next.js Route Parity & AppShell Integration', () => {
  const root = process.cwd();
  const appDir = path.join(root, 'platform', 'web', 'app');

  it('/agents route loads AgentWorkspace and sets activeView to agent-workspace', () => {
    const content = fs.readFileSync(path.join(appDir, 'agents', 'page.tsx'), 'utf8');
    assert.ok(content.includes('activeView="agent-workspace"'));
    assert.ok(content.includes('AgentWorkspace'));
  });

  it('/arena route loads ModelArena and sets activeView to modelArena', () => {
    const content = fs.readFileSync(path.join(appDir, 'arena', 'page.tsx'), 'utf8');
    assert.ok(content.includes('activeView="modelArena"'));
    assert.ok(content.includes('ModelArena'));
  });

  it('/personal-style route loads PersonalStyleLab and sets activeView to personalStyle', () => {
    const content = fs.readFileSync(path.join(appDir, 'personal-style', 'page.tsx'), 'utf8');
    assert.ok(content.includes('activeView="personalStyle"'));
    assert.ok(content.includes('PersonalStyleLab'));
  });

  it('/datasets route loads DatasetIntelligence and sets activeView to datasets', () => {
    const content = fs.readFileSync(path.join(appDir, 'datasets', 'page.tsx'), 'utf8');
    assert.ok(content.includes('activeView="datasets"'));
    assert.ok(content.includes('DatasetIntelligence'));
  });

  it('/fine-tuning route loads FineTuningFactory and sets activeView to fine-tuning', () => {
    const content = fs.readFileSync(path.join(appDir, 'fine-tuning', 'page.tsx'), 'utf8');
    assert.ok(content.includes('activeView="fine-tuning"'));
    assert.ok(content.includes('FineTuningFactory'));
  });

  it('/knowledge route loads KnowledgeView and sets activeView to knowledge', () => {
    const content = fs.readFileSync(path.join(appDir, 'knowledge', 'page.tsx'), 'utf8');
    assert.ok(content.includes('activeView="knowledge"'));
    assert.ok(content.includes('KnowledgeView'));
  });
});
