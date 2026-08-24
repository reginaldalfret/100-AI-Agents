import test from 'node:test';
import assert from 'node:assert/strict';
import { globalResponseExportEngine } from '../../platform/exports/response-export-engine.js';

test('1. PDF Export: Generates formatted PDF document with title, sections, and code', async () => {
  const content = '# Summary of Findings\nHere is a comprehensive summary of our findings.\n\n```python\ndef evaluate_metric():\n    return 42\n```';

  const res = await globalResponseExportEngine.exportResponse({
    content,
    title: 'Summary of Findings',
    format: 'pdf'
  });

  assert.equal(res.filename, 'summary-of-findings.pdf');
  assert.equal(res.mimeType, 'application/pdf');
  assert.ok(res.sizeBytes > 500, 'PDF buffer must have valid size');
  assert.ok(res.buffer.toString('utf8', 0, 5).startsWith('%PDF-'), 'Buffer must start with valid PDF magic bytes');
  assert.equal(typeof res.sha256, 'string');
});
