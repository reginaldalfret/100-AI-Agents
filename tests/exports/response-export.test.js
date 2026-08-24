import test from 'node:test';
import assert from 'node:assert/strict';
import { globalResponseExportEngine } from '../../platform/exports/response-export-engine.js';

test('1. Response Export Engine: Rejects empty content and invalid formats', async () => {
  await assert.rejects(
    async () => globalResponseExportEngine.exportResponse({ content: '', format: 'pdf' }),
    /EXPORT_VALIDATION_FAILED/
  );

  await assert.rejects(
    async () => globalResponseExportEngine.exportResponse({ content: 'Hello world', format: 'unsupported_ext' }),
    /EXPORT_FORMAT_UNSUPPORTED/
  );
});
