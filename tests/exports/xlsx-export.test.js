import test from 'node:test';
import assert from 'node:assert/strict';
import { globalResponseExportEngine } from '../../platform/exports/response-export-engine.js';

test('1. XLSX Export: Generates valid Excel workbook with structured data tables', async () => {
  const content = `# Sales Report
| Product | Price | Quantity | Total |
|---|---|---|---|
| Widget A | 100 | 5 | 500 |
| Widget B | 250 | 2 | 500 |
`;

  const res = await globalResponseExportEngine.exportResponse({
    content,
    title: 'Sales Report',
    format: 'xlsx'
  });

  assert.equal(res.filename, 'sales-report.xlsx');
  assert.equal(res.mimeType, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  assert.ok(res.sizeBytes > 1000);
  assert.ok(res.buffer.toString('utf8', 0, 2) === 'PK', 'XLSX must be a valid zip container');
});
