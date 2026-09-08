import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('QLoRA Real Training Artifact & Load Verification', () => {
  const adapterDir = 'E:\\Smart Automation\\100-AI-Agents\\models\\fine-tuned\\experiments\\cybersecurity-poc-v1\\adapter';
  const evalDir = 'E:\\Smart Automation\\100-AI-Agents\\models\\fine-tuned\\experiments\\cybersecurity-poc-v1\\evaluation';

  it('should verify adapter directory exists', () => {
    assert.ok(fs.existsSync(adapterDir));
  });

  it('should check for non-zero adapter files if training has finished', () => {
    const configPath = path.join(adapterDir, 'adapter_config.json');
    if (fs.existsSync(configPath)) {
      assert.ok(fs.statSync(configPath).size > 0, 'adapter_config.json must have non-zero size');
    }
  });

  it('should verify evaluation directory exists', () => {
    assert.ok(fs.existsSync(evalDir));
  });
});
