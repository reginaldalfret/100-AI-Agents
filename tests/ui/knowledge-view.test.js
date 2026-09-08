import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

describe('Knowledge Base UI Components in index.html', () => {
  const html = fs.readFileSync(path.join(ROOT, 'platform', 'web', 'index.html'), 'utf8');

  it('should contain #navKnowledgeBtn in sidebar', () => {
    assert.ok(html.includes('id="navKnowledgeBtn"'), 'Must have #navKnowledgeBtn in sidebar');
    assert.ok(html.includes('Obsidian Knowledge'), 'Must have Obsidian Knowledge label');
  });

  it('should contain upgraded #knowledgeView section', () => {
    assert.ok(html.includes('id="knowledgeView"'), 'Must have #knowledgeView container');
    assert.ok(html.includes('Obsidian Knowledge Bridge &amp; RAG'), 'Must have view header');
  });

  it('should contain knowledge action buttons (Sync and Rebuild)', () => {
    assert.ok(html.includes('id="kbSyncBtn"'), 'Must have sync button');
    assert.ok(html.includes('id="kbRebuildBtn"'), 'Must have rebuild button');
  });

  it('should contain knowledge subnav tabs and search explorer', () => {
    assert.ok(html.includes('data-kb-tab="vaultTab"'), 'Must have vault tab');
    assert.ok(html.includes('data-kb-tab="documentsTab"'), 'Must have documents tab');
    assert.ok(html.includes('data-kb-tab="datasetsTab"'), 'Must have datasets tab');
    assert.ok(html.includes('data-kb-tab="ragTab"'), 'Must have RAG tab');
    assert.ok(html.includes('data-kb-tab="searchTab"'), 'Must have search tab');
    assert.ok(html.includes('id="kbSearchInput"'), 'Must have search input');
    assert.ok(html.includes('id="btnExecuteKBSearch"'), 'Must have search execute button');
  });

  it('should contain #chatModeToggle in composer toolbar', () => {
    assert.ok(html.includes('id="chatModeToggle"'), 'Must have #chatModeToggle in composer toolbar');
    assert.ok(html.includes('id="modeStandardBtn"'), 'Must have modeStandardBtn');
    assert.ok(html.includes('id="modeKnowledgeBtn"'), 'Must have modeKnowledgeBtn');
  });
});
