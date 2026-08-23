import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { 
  citationGenerator, 
  CitationGenerator 
} from '../../platform/rag/index.js';

describe('RAG Subsystem — 9. Citation Generation & Reference Formatter Test Suite', () => {
  const generator = new CitationGenerator();

  const docChunk = {
    chunkId: 'chk_pdf_01',
    documentId: 'doc_sop_042',
    filename: 'SOP-MRPL-INSP-042.pdf',
    fileType: 'pdf',
    pageNumber: 14,
    heading: 'Shell Course 3 Retirement Limit',
    chunkType: 'prose',
    text: 'According to API-653 standard, Tank Shell Course 3 minimum thickness is 6.80 mm.',
    score: 0.95
  };

  const sheetChunk = {
    chunkId: 'chk_xlsx_01',
    documentId: 'doc_fin_2026',
    filename: 'Q3_Corrosion_Budget.xlsx',
    fileType: 'xlsx',
    pageNumber: 1,
    heading: 'Spreadsheet: Equipment Replacement',
    chunkType: 'table',
    text: '| Item | Cost | Status |\n| TK-101 Shell | ₹1,200,000 | Approved |',
    tableMetadata: {
      tableName: 'Equipment Replacement',
      startRow: 1,
      endRow: 15,
      totalRows: 15,
      headers: ['Item', 'Cost', 'Status']
    },
    score: 0.88
  };

  const codeChunk = {
    chunkId: 'chk_code_01',
    documentId: 'doc_router',
    filename: 'platform/models/model-router.js',
    fileType: 'js',
    pageNumber: 1,
    heading: 'FUNCTION: routeTaskToLocalModel',
    chunkType: 'code',
    startLine: 13,
    endLine: 67,
    codeMetadata: {
      symbol: 'routeTaskToLocalModel',
      symbolType: 'function',
      startLine: 13,
      endLine: 67
    },
    text: 'export async function routeTaskToLocalModel(taskInput = {}) {\n  // Local dispatch\n}',
    score: 0.92
  };

  test('1. Generates precise PDF document citations with page number and section', () => {
    const citations = generator.generateCitations([docChunk]);

    assert.strictEqual(citations.length, 1);
    const cit = citations[0];

    assert.strictEqual(cit.citationType, 'document');
    assert.strictEqual(cit.filename, 'SOP-MRPL-INSP-042.pdf');
    assert.strictEqual(cit.page, 14);
    assert.strictEqual(cit.section, 'Shell Course 3 Retirement Limit');
    assert.strictEqual(cit.citationText, "SOP-MRPL-INSP-042.pdf, Page 14, Section 'Shell Course 3 Retirement Limit'");
    assert.strictEqual(cit.inlineCitation, "[SOP-MRPL-INSP-042.pdf, Page 14, Section 'Shell Course 3 Retirement Limit']");
    assert.ok(cit.excerpt.includes('6.80 mm'));
  });

  test('2. Generates precise Spreadsheet citations with Sheet Name and Row range', () => {
    const citations = generator.generateCitations([sheetChunk]);

    assert.strictEqual(citations.length, 1);
    const cit = citations[0];

    assert.strictEqual(cit.citationType, 'spreadsheet');
    assert.strictEqual(cit.filename, 'Q3_Corrosion_Budget.xlsx');
    assert.strictEqual(cit.sheetInfo.sheetName, 'Equipment Replacement');
    assert.strictEqual(cit.sheetInfo.startRow, 1);
    assert.strictEqual(cit.sheetInfo.endRow, 15);
    assert.strictEqual(cit.citationText, 'Q3_Corrosion_Budget.xlsx [Equipment Replacement, Rows 1-15]');
  });

  test('3. Generates precise Source Code citations with startLine and endLine numbers', () => {
    const citations = generator.generateCitations([codeChunk]);

    assert.strictEqual(citations.length, 1);
    const cit = citations[0];

    assert.strictEqual(cit.citationType, 'code');
    assert.strictEqual(cit.filename, 'platform/models/model-router.js');
    assert.strictEqual(cit.codeRange.startLine, 13);
    assert.strictEqual(cit.codeRange.endLine, 67);
    assert.strictEqual(cit.codeRange.symbol, 'routeTaskToLocalModel');
    assert.strictEqual(cit.citationText, 'platform/models/model-router.js:L13-L67 (routeTaskToLocalModel)');
  });

  test('4. Formats comprehensive Markdown references and bibliography block', () => {
    const citations = generator.generateCitations([docChunk, sheetChunk, codeChunk]);
    const markdown = generator.formatMarkdownReferences(citations);

    assert.ok(markdown.includes('### Citations & Sources'));
    assert.ok(markdown.includes('1. **SOP-MRPL-INSP-042.pdf**'));
    assert.ok(markdown.includes('2. **Q3_Corrosion_Budget.xlsx**'));
    assert.ok(markdown.includes('3. **platform/models/model-router.js**'));
    assert.ok(markdown.includes('L13-L67'));
    assert.ok(markdown.includes('> "'));
  });

  test('5. Handles single inline citation formatter and empty lists', () => {
    const inline = generator.formatInlineCitation(codeChunk);
    assert.strictEqual(inline, '[platform/models/model-router.js:L13-L67 (routeTaskToLocalModel)]');

    assert.deepStrictEqual(generator.generateCitations([]), []);
    assert.strictEqual(generator.formatMarkdownReferences([]), '');
  });
});
