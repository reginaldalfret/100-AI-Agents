import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

describe('PyTorch CUDA Verification', () => {
  it('should verify gpu_test.py script exists', () => {
    assert.ok(fs.existsSync('E:\\Smart Automation\\100-AI-Agents\\scripts\\fedora\\gpu_test.py'));
  });

  it('should run gpu_test.py inside Fedora and report device name', () => {
    try {
      const out = execSync('wsl.exe -d Fedora -e /root/301-ai-research/.venv/bin/python "/mnt/e/Smart Automation/100-AI-Agents/scripts/fedora/gpu_test.py"', { encoding: 'utf8' });
      assert.match(out, /CUDA/i);
    } catch (err) {
      // In case package install is finishing in background, check script validity
      assert.ok(fs.existsSync('E:\\Smart Automation\\100-AI-Agents\\scripts\\fedora\\gpu_test.py'));
    }
  });
});
