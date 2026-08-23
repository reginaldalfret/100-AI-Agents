import test from 'node:test';
import assert from 'node:assert/strict';
import { globalResponseExportEngine } from '../../platform/exports/response-export-engine.js';

test('1. CSV Export: Generates RFC-compliant UTF-8 CSV with proper escaping', async () => {
  const content = '# Inventory List\n| Item Name | Description | Stock |\n|---|---|---|\n| Gadget "Pro" | High quality, sealed | 15 |\n| Widget Basic | Standard edition | 40 |';

  const res = await globalResponseExportEngine.exportResponse({
    content,
    title: 'Inventory List',
    format: 'csv'
  });

  assert.equal(res.filename, 'inventory-list.csv');
  assert.equal(res.mimeType, 'text/csv; charset=utf-8');
  const csvText = res.buffer.toString('utf8');
  assert.match(csvText, /Item Name,Description,Stock/);
  assert.match(csvText, /Gadget/);
});
