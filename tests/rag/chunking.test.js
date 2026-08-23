import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { 
  chunker, 
  Chunker, 
  documentIngestion 
} from '../../platform/rag/index.js';

describe('RAG Subsystem — 2. Structure-Aware Chunking Test Suite', () => {
  const customChunker = new Chunker({
    targetChunkChars: 400,
    overlapChars: 100,
    maxTableRowsPerChunk: 5
  });

  test('1. Chunks markdown document preserving headings and section boundaries', async () => {
    const mdContent = [
      '# Refinery Storage Tank Standard',
      '',
      '## Section 1: Scope and Applicability',
      'This standard applies to all atmospheric above-ground storage tanks containing petroleum products, crude oils, and intermediate feedstocks across all operating units.',
      '',
      '## Section 2: Inspection Intervals',
      'Routine visual inspections shall be performed at intervals not exceeding one month by qualified site operators. Ultrasonic thickness measurements of tank shell courses shall be conducted every 5 years.',
      '',
      '## Section 3: Retirement Thickness Limits',
      'The minimum acceptable retirement thickness for course 1 is 8.50 mm, course 2 is 7.20 mm, and course 3 is 6.80 mm per API-653 standard formulas.'
    ].join('\n');

    const doc = await documentIngestion.ingestBuffer(mdContent, 'tank_standard.md');
    const chunks = customChunker.chunkDocument(doc);

    assert.ok(chunks.length >= 3);
    assert.ok(chunks.every(c => c.chunkId.includes(doc.documentId)));
    assert.ok(chunks.every(c => c.chunkHash && c.chunkHash.length === 64));
    assert.ok(chunks.every(c => c.tokenEstimate > 0));
    assert.ok(chunks.every(c => c.enrichedText.startsWith('[Document: tank_standard.md')));

    const sec3Chunk = chunks.find(c => c.heading.includes('Section 3') || c.text.includes('Course 3 is 6.80 mm'));
    assert.ok(sec3Chunk, 'Section 3 chunk found');
    assert.ok(sec3Chunk.text.includes('6.80 mm'));
  });

  test('2. Chunks large tables repeating table headers on every chunk', async () => {
    const rows = [];
    for (let i = 1; i <= 15; i++) {
      rows.push(`TK-${100 + i},Course-${(i % 5) + 1},${(6.0 + i * 0.2).toFixed(2)},mm,Good`);
    }
    const csvContent = ['tank_id,course,thickness,unit,condition', ...rows].join('\n');

    const doc = await documentIngestion.ingestBuffer(csvContent, 'thickness_matrix.csv');
    const chunks = customChunker.chunkDocument(doc);

    // With 15 rows and maxTableRowsPerChunk = 5, we expect 3 chunks
    assert.strictEqual(chunks.length, 3);
    assert.ok(chunks.every(c => c.chunkType === 'table'));
    
    // Check that every chunk repeats the header row
    for (const chk of chunks) {
      assert.ok(chk.text.includes('| tank_id | course | thickness | unit | condition |'));
      assert.ok(chk.text.includes('| --- | --- | --- | --- | --- |'));
      assert.ok(chk.tableMetadata);
      assert.strictEqual(chk.tableMetadata.totalRows, 15);
      assert.ok(chk.tableMetadata.startRow >= 1);
      assert.ok(chk.tableMetadata.endRow <= 15);
    }

    assert.strictEqual(chunks[0].tableMetadata.startRow, 1);
    assert.strictEqual(chunks[0].tableMetadata.endRow, 5);
    assert.strictEqual(chunks[1].tableMetadata.startRow, 6);
    assert.strictEqual(chunks[1].tableMetadata.endRow, 10);
    assert.strictEqual(chunks[2].tableMetadata.startRow, 11);
    assert.strictEqual(chunks[2].tableMetadata.endRow, 15);
  });

  test('3. Chunks code files preserving code symbols and exact startLine/endLine ranges', async () => {
    const code = [
      '// Line 1: Header comment',
      'export function inspectPumpVibration(pumpId, amplitude) {',
      '  if (amplitude > 4.5) {',
      '    return { alert: "HIGH_VIBRATION", trip: true };',
      '  }',
      '  return { alert: "NORMAL", trip: false };',
      '}',
      '',
      'export function calculatePumpEfficiency(flowRate, headPressure, powerKw) {',
      '  const hydraulicPower = (flowRate * headPressure * 9.81) / 3600;',
      '  const efficiency = (hydraulicPower / powerKw) * 100;',
      '  return Math.min(100, Math.max(0, efficiency));',
      '}'
    ].join('\n');

    const doc = await documentIngestion.ingestBuffer(code, 'pump_analytics.js');
    const chunks = chunker.chunkDocument(doc);

    assert.ok(chunks.length >= 2);
    const pumpVib = chunks.find(c => c.heading.includes('inspectPumpVibration'));
    assert.ok(pumpVib, 'inspectPumpVibration chunk found');
    assert.strictEqual(pumpVib.chunkType, 'code');
    assert.strictEqual(pumpVib.startLine, 2);
    assert.ok(pumpVib.endLine >= 7);
    assert.ok(pumpVib.codeMetadata.symbol.includes('inspectPumpVibration'));

    const pumpEff = chunks.find(c => c.heading.includes('calculatePumpEfficiency'));
    assert.ok(pumpEff, 'calculatePumpEfficiency chunk found');
    assert.strictEqual(pumpEff.startLine, 9);
    assert.ok(pumpEff.endLine >= 13);
  });

  test('4. Enriches chunks with context prefix and deterministic SHA-256 chunk hashes', async () => {
    const doc = await documentIngestion.ingestBuffer('Single line content for hash test', 'test.txt');
    const chunks = chunker.chunkDocument(doc);

    assert.strictEqual(chunks.length, 1);
    const chk = chunks[0];
    assert.ok(chk.contextPrefix.includes('Document: test.txt'));
    assert.ok(chk.enrichedText.includes('Single line content for hash test'));
    assert.strictEqual(typeof chk.chunkHash, 'string');
    assert.strictEqual(chk.chunkHash.length, 64);
  });

  test('5. Gracefully handles empty or null document inputs', () => {
    const emptyChunks = chunker.chunkDocument(null);
    assert.deepStrictEqual(emptyChunks, []);

    const emptyDocChunks = chunker.chunkDocument({});
    assert.deepStrictEqual(emptyDocChunks, []);
  });
});
