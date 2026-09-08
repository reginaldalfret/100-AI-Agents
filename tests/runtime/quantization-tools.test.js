import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

describe('Quantization Lab Tooling Verification', () => {
  it('should verify quantize-model.sh exists and is properly formed', () => {
    const scriptPath = 'E:\\Smart Automation\\100-AI-Agents\\scripts\\fedora\\quantize-model.sh';
    assert.ok(fs.existsSync(scriptPath));
    const content = fs.readFileSync(scriptPath, 'utf8');
    assert.match(content, /Q4_K_M/);
    assert.match(content, /Q8_0/);
    assert.match(content, /Q2_K/);
  });

  it('should verify quantization lab documentation exists', () => {
    assert.ok(fs.existsSync('E:\\Smart Automation\\100-AI-Agents\\docs\\ml\\QUANTIZATION-LAB.md'));
  });
});
