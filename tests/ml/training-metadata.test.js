import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Training Metadata & Experiment Reproducibility', () => {
  const metaDir = 'E:\\Smart Automation\\100-AI-Agents\\models\\fine-tuned\\experiments\\cybersecurity-poc-v1\\metadata';
  const metaPath = path.join(metaDir, 'metadata.json');

  it('should validate metadata directory structure exists', () => {
    assert.ok(fs.existsSync(metaDir));
  });

  it('should validate metadata contract if metadata.json exists', () => {
    if (fs.existsSync(metaPath)) {
      const data = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      assert.ok(data.experiment_id, 'experiment_id must be defined');
      assert.ok(data.base_model, 'base_model must be defined');
      assert.ok(data.dataset && data.dataset.sha256, 'dataset sha256 must be defined');
      assert.ok(data.hardware && data.hardware.gpu, 'GPU hardware must be defined');
      assert.ok(data.hyperparameters, 'hyperparameters must be present');
    }
  });
});
