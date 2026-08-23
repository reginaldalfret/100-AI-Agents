/**
 * Attachment Integrity Forensic Test Suite
 * Validates that browser payload -> server decoding preserves byte-for-byte SHA-256 hash
 * for real PNG images and real PDFs.
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  stripDataUrlPrefix,
  decodeAttachmentToBuffer,
  validateAttachmentIntegrity
} from '../../platform/multimodal/attachment-integrity.js';

test('1. Data URL Prefix Stripping', () => {
  const pureBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const dataUrlPng = `data:image/png;base64,${pureBase64}`;
  const dataUrlJpeg = `data:image/jpeg;base64,${pureBase64}`;

  assert.strictEqual(stripDataUrlPrefix(dataUrlPng), pureBase64);
  assert.strictEqual(stripDataUrlPrefix(dataUrlJpeg), pureBase64);
  assert.strictEqual(stripDataUrlPrefix(pureBase64), pureBase64);
});

test('2. Real PNG Image Byte-for-Byte SHA-256 Preservation', () => {
  const fixturePath = path.resolve('tests/multimodal/fixtures/chatgpt-image-real.png');
  const originalBytes = fs.readFileSync(fixturePath);
  const originalSha256 = crypto.createHash('sha256').update(originalBytes).digest('hex');

  // Simulate browser FileReader readAsDataURL
  const browserDataUrl = `data:image/png;base64,${originalBytes.toString('base64')}`;

  const attachment = {
    name: 'ChatGPT Image Aug 22, 2026, 10_32_13 PM.png',
    type: 'image/png',
    size: originalBytes.length,
    data: browserDataUrl
  };

  const validation = validateAttachmentIntegrity(attachment);
  assert.strictEqual(validation.valid, true);
  assert.strictEqual(validation.isImage, true);
  assert.strictEqual(validation.detectedType, 'image/png');
  assert.strictEqual(validation.size, originalBytes.length);
  assert.strictEqual(validation.sha256, originalSha256, 'Server decoded SHA-256 must match original file SHA-256');

  // Verify decoded buffer equals original bytes
  assert.deepStrictEqual(validation.buffer, originalBytes);
});

test('3. Real PDF Byte-for-Byte SHA-256 Preservation & Native Extraction', () => {
  const fixturePath = path.resolve('tests/multimodal/fixtures/project-review-request-fixed.pdf');
  const originalBytes = fs.readFileSync(fixturePath);
  const originalSha256 = crypto.createHash('sha256').update(originalBytes).digest('hex');

  // Simulate browser FileReader readAsDataURL
  const browserDataUrl = `data:application/pdf;base64,${originalBytes.toString('base64')}`;

  const attachment = {
    name: 'project_review_request_fixed.pdf',
    type: 'application/pdf',
    size: originalBytes.length,
    data: browserDataUrl
  };

  const validation = validateAttachmentIntegrity(attachment);
  assert.strictEqual(validation.valid, true);
  assert.strictEqual(validation.isPdf, true);
  assert.strictEqual(validation.detectedType, 'application/pdf');
  assert.strictEqual(validation.size, originalBytes.length);
  assert.strictEqual(validation.sha256, originalSha256, 'Server decoded PDF SHA-256 must match original file SHA-256');
});
