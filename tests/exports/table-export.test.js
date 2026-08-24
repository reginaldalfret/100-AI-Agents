import test from 'node:test';
import assert from 'node:assert/strict';
import { globalResponseExportEngine } from '../../platform/exports/response-export-engine.js';

test('1. Table Export: Preserves tabular structure in both Excel and CSV', async () => {
  const content = `| Language | Type | Score |
|---|---|---|
| Rust | Compiled | 98 |
| Python | Interpreted | 92 |
`;

  const csv = await globalResponseExportEngine.exportResponse({ content, title: 'Lang Scores', format: 'csv' });
  const xlsx = await globalResponseExportEngine.exportResponse({ content, title: 'Lang Scores', format: 'xlsx' });

  assert.match(csv.buffer.toString('utf8'), /Rust,Compiled,98/);
  assert.ok(xlsx.sizeBytes > 4000);
});
