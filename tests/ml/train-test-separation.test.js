import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

describe('Train/Test Data Separation & Contamination Integrity', () => {
  const dataDir = 'E:\\Smart Automation\\100-AI-Agents\\data\\fine-tuning\\synthetic';
  const trainPath = path.join(dataDir, 'cybersecurity_poc_train.jsonl');
  const valPath = path.join(dataDir, 'cybersecurity_poc_val.jsonl');
  const testPath = path.join(dataDir, 'cybersecurity_poc_test.jsonl');
  const csvPath = path.join(dataDir, 'cybersecurity_synthetic_500.csv');

  it('should verify train, validation, and test files exist', () => {
    assert.ok(fs.existsSync(trainPath));
    assert.ok(fs.existsSync(valPath));
    assert.ok(fs.existsSync(testPath));
    assert.ok(fs.existsSync(csvPath));
  });

  it('should verify 80% / 10% / 10% split counts (400 / 50 / 50)', () => {
    const trainLines = fs.readFileSync(trainPath, 'utf8').trim().split('\n').filter(Boolean);
    const valLines = fs.readFileSync(valPath, 'utf8').trim().split('\n').filter(Boolean);
    const testLines = fs.readFileSync(testPath, 'utf8').trim().split('\n').filter(Boolean);

    assert.strictEqual(trainLines.length, 400, 'Train dataset must have exactly 400 records');
    assert.strictEqual(valLines.length, 50, 'Validation dataset must have exactly 50 records');
    assert.strictEqual(testLines.length, 50, 'Test dataset must have exactly 50 records');
  });

  it('should verify zero overlap between train and test instruction sets', () => {
    const trainRecords = fs.readFileSync(trainPath, 'utf8').trim().split('\n').map(JSON.parse);
    const testRecords = fs.readFileSync(testPath, 'utf8').trim().split('\n').map(JSON.parse);

    const trainInsts = new Set(trainRecords.map(r => r.instruction));
    const testInsts = new Set(testRecords.map(r => r.instruction));

    const intersection = [...trainInsts].filter(x => testInsts.has(x));
    assert.strictEqual(intersection.length, 0, 'No test instructions must be present in training data');
  });

  it('should calculate and verify source dataset SHA-256 hash', () => {
    const content = fs.readFileSync(csvPath);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    assert.strictEqual(hash, 'f873345e5cab762a156fd01b7a010bdf4fbbb2a38497582cca0cf9e456ecbcf5');
  });
});
