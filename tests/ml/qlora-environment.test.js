import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { researchJobManager, JobStatus, SafetyRating } from '../../platform/research/research-job-manager.js';

describe('QLoRA Fine-Tuning & Safety Evaluation', () => {
  it('should verify test-qlora.py script exists', () => {
    assert.ok(fs.existsSync('E:\\Smart Automation\\100-AI-Agents\\scripts\\fedora\\test-qlora.py'));
  });

  it('should evaluate 1.0B 4-bit model as SAFE on RTX 2050', () => {
    const safety = researchJobManager.evaluateSafety({ modelSizeB: 1.0, precision: '4bit' });
    assert.strictEqual(safety.rating, SafetyRating.SAFE);
  });

  it('should evaluate 7.0B model as UNSUPPORTED on RTX 2050 4GB VRAM', () => {
    const safety = researchJobManager.evaluateSafety({ modelSizeB: 7.0 });
    assert.strictEqual(safety.rating, SafetyRating.UNSUPPORTED);
  });

  it('should create research fine-tune job with proper initial state', () => {
    const job = researchJobManager.createJob('QLORA_FINETUNE', { modelSizeB: 1.0 });
    assert.strictEqual(job.status, JobStatus.QUEUED);
    assert.strictEqual(job.safety.rating, SafetyRating.SAFE);
  });
});
