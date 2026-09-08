import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Model Evaluation & Held-Out Comparison Contract', () => {
  const evalDir = 'E:\\Smart Automation\\100-AI-Agents\\models\\fine-tuned\\experiments\\cybersecurity-poc-v1\\evaluation';

  it('should verify evaluation folder exists', () => {
    assert.ok(fs.existsSync(evalDir));
  });

  it('should validate format of finetuned responses when generated', () => {
    const responsesPath = path.join(evalDir, 'finetuned-responses.json');
    if (fs.existsSync(responsesPath)) {
      const data = JSON.parse(fs.readFileSync(responsesPath, 'utf8'));
      assert.ok(Array.isArray(data));
      if (data.length > 0) {
        assert.ok(data[0].instruction);
        assert.ok(data[0].adapter_prediction);
      }
    }
  });
});
