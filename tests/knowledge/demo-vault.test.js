import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { obsidianConfig } from '../../platform/knowledge/obsidian-config.js';
import { initDemoVaultIfEmpty } from '../../platform/knowledge/demo-vault.js';

describe('Demo Vault Initialization', () => {
  it('should initialize starter demonstration notes', () => {
    initDemoVaultIfEmpty();
    const vault = obsidianConfig.vaultPath;
    assert.ok(fs.existsSync(vault), 'Vault folder should exist');

    const expectedNotes = [
      '01-Architecture/301 Architecture.md',
      '02-Models/Ollama.md',
      '04-Fine-Tuning/QLoRA.md',
      '06-Mobile-LLM/Mobile LLM Research.md',
      '07-Quantization/Quantization.md',
      '12-Cybersecurity/Cybersecurity.md',
      '13-Healthcare/Healthcare.md'
    ];

    expectedNotes.forEach(rel => {
      const full = path.join(vault, rel);
      assert.ok(fs.existsSync(full), `Note ${rel} should exist`);
      const content = fs.readFileSync(full, 'utf8');
      assert.ok(content.startsWith('---'), 'Note should have frontmatter');
      assert.ok(content.includes('title:'), 'Note should have title');
    });
  });
});
