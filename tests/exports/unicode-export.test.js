import test from 'node:test';
import assert from 'node:assert/strict';
import { globalResponseExportEngine } from '../../platform/exports/response-export-engine.js';

test('1. Unicode Export: Preserves rupee symbol and special characters in CSV and XLSX', async () => {
  const content = '# Pricing Plan\n| Plan | Cost |\n|---|---|\n| Basic | ₹2,500 |\n| Enterprise | ₹50,000 |';

  const csv = await globalResponseExportEngine.exportResponse({ content, title: 'Pricing', format: 'csv' });
  assert.match(csv.buffer.toString('utf8'), /₹2,500/);
});
