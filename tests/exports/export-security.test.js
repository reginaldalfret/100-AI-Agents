import test from 'node:test';
import assert from 'node:assert/strict';
import { globalResponseExportEngine } from '../../platform/exports/response-export-engine.js';

test('1. Export Security: Prevents path traversal and unsafe file generation', () => {
  const sanitized = globalResponseExportEngine.generateFilename('../../../etc/passwd', 'pdf');
  assert.equal(sanitized.includes('..'), false);
  assert.equal(sanitized.includes('/'), false);
  assert.equal(sanitized.includes('\\'), false);
});
