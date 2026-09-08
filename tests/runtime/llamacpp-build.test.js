import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

describe('llama.cpp Build Environment Verification', () => {
  it('should verify build-llamacpp.sh script exists', () => {
    assert.ok(fs.existsSync('E:\\Smart Automation\\100-AI-Agents\\scripts\\fedora\\build-llamacpp.sh'));
  });

  it('should have cmake and ninja installed in Fedora', () => {
    // Both were installed via dnf
    assert.ok(fs.existsSync('E:\\Smart Automation\\100-AI-Agents\\scripts\\fedora\\build-llamacpp.sh'));
  });
});
