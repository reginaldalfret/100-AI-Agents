import { describe, it } from 'node:test';
import assert from 'node:assert';
import { obsidianConfig } from '../../platform/knowledge/obsidian-config.js';

describe('Knowledge Security Exclusions & Safety', () => {
  it('should detect secret files as unsafe', () => {
    assert.strictEqual(obsidianConfig.isSecretFile('.env'), true);
    assert.strictEqual(obsidianConfig.isSecretFile('.env.production'), true);
    assert.strictEqual(obsidianConfig.isSecretFile('id_rsa'), true);
    assert.strictEqual(obsidianConfig.isSecretFile('credentials.json'), true);
    assert.strictEqual(obsidianConfig.isSecretFile('private.key'), true);
  });

  it('should allow normal markdown notes', () => {
    assert.strictEqual(obsidianConfig.isSecretFile('301 Architecture.md'), false);
    assert.strictEqual(obsidianConfig.isSecretFile('Research.md'), false);
  });

  it('should reject hidden directories (.git, .obsidian, .trash)', () => {
    assert.strictEqual(obsidianConfig.isSecretFile('.obsidian/workspace.json'), true);
    assert.strictEqual(obsidianConfig.isSecretFile('.git/config'), true);
  });
});
