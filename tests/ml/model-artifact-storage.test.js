import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Model Artifact Storage Hierarchy', () => {
  const modelsRoot = 'E:\\Smart Automation\\100-AI-Agents\\models';

  it('should maintain distinct directories for each model stage', () => {
    const stages = ['research', 'fine-tuned', 'quantized', 'mobile'];
    stages.forEach((stage) => {
      const p = path.join(modelsRoot, stage);
      assert.ok(fs.existsSync(p), `Stage folder ${stage} must exist`);
    });
  });

  it('should verify export script exists for syncing Linux artifacts to E: storage', () => {
    assert.ok(fs.existsSync('E:\\Smart Automation\\100-AI-Agents\\scripts\\fedora\\export-model.sh'));
  });
});
