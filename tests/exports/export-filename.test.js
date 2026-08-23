import test from 'node:test';
import assert from 'node:assert/strict';
import { globalResponseExportEngine } from '../../platform/exports/response-export-engine.js';

test('1. Export Filename: Sanitizes unsafe characters and generates Windows-compliant filenames', () => {
  assert.equal(
    globalResponseExportEngine.generateFilename('Palindrome: Program & Analysis / v1.0', 'pdf'),
    'palindrome-program-analysis-v1-0.pdf'
  );
  assert.equal(
    globalResponseExportEngine.generateFilename('What is RAG???', 'xlsx'),
    'what-is-rag.xlsx'
  );
  assert.equal(
    globalResponseExportEngine.generateFilename('', 'csv'),
    'response.csv'
  );
});
