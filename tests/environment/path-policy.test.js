import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Storage & Path Sovereignty Policy', () => {
  it('should enforce authoritative model storage resides on E: drive', () => {
    const eModelsPath = 'E:\\Smart Automation\\100-AI-Agents\\models';
    assert.ok(fs.existsSync(eModelsPath), 'Models directory must exist on E:');
    assert.ok(fs.existsSync(path.join(eModelsPath, 'research')));
    assert.ok(fs.existsSync(path.join(eModelsPath, 'fine-tuned')));
    assert.ok(fs.existsSync(path.join(eModelsPath, 'quantized')));
    assert.ok(fs.existsSync(path.join(eModelsPath, 'mobile')));
  });

  it('should guarantee no project data directories are placed under C: root', () => {
    const disallowed = ['C:\\301-models', 'C:\\301-research', 'C:\\ai-models'];
    disallowed.forEach((p) => {
      assert.strictEqual(fs.existsSync(p), false, `${p} must not exist on C: drive`);
    });
  });
});
