import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Original Base Model Protection & Isolation', () => {
  const root = 'E:\\Smart Automation\\100-AI-Agents';
  const ollamaModelsPath = path.join(root, 'models', 'ollama');
  const expPath = path.join(root, 'models', 'fine-tuned', 'experiments', 'cybersecurity-poc-v1');

  it('should verify production Ollama directory is distinct from experiment directory', () => {
    assert.notStrictEqual(ollamaModelsPath, expPath);
    assert.ok(fs.existsSync(ollamaModelsPath));
  });

  it('should guarantee fine-tuning experiment artifacts reside under fine-tuned directory', () => {
    assert.ok(fs.existsSync(expPath));
    assert.ok(fs.existsSync(path.join(expPath, 'adapter')));
    assert.ok(fs.existsSync(path.join(expPath, 'checkpoints')));
  });
});
