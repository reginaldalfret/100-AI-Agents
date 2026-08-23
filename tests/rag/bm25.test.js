import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { 
  BM25Index, 
  IngestionNamespace 
} from '../../platform/rag/index.js';

describe('RAG Subsystem — 5. BM25 Lexical Retrieval Engine Test Suite', () => {
  const bm25 = new BM25Index({ k1: 1.2, b: 0.75 });

  const sampleCorpus = [
    {
      chunkId: 'chk_sop_001',
      documentId: 'doc_sop_001',
      filename: 'SOP-MRPL-INSP-042.pdf',
      namespace: IngestionNamespace.GLOBAL,
      text: 'API-653 standard Crude Storage Tank Shell Course 3 retirement limit is 6.80 mm with corrosion rate 0.12 mm/yr.',
      enrichedText: '[Document: SOP-MRPL-INSP-042.pdf] API-653 standard Tank Shell Course 3 retirement limit 6.80 mm.',
      pageNumber: 14
    },
    {
      chunkId: 'chk_sop_002',
      documentId: 'doc_sop_002',
      filename: 'SOP-MRPL-FIRE-018.pdf',
      namespace: IngestionNamespace.GLOBAL,
      text: 'OISD-STD-129 Fire protection standard for petroleum refineries requires minimum 7.0 kg/cm2 water header pressure.',
      enrichedText: '[Document: SOP-MRPL-FIRE-018.pdf] OISD-STD-129 Fire protection standard 7.0 kg/cm2 pressure.',
      pageNumber: 3
    },
    {
      chunkId: 'chk_gate_001',
      documentId: 'doc_gate_src',
      filename: 'server.js',
      namespace: IngestionNamespace.PROJECT,
      text: 'const PORT = Number(process.env.PORT || 8300); const HOST = process.env.HOST || "0.0.0.0";',
      enrichedText: '[Document: server.js] PORT 8300 default gateway listener host 0.0.0.0.',
      pageNumber: 1
    }
  ];

  test('1. Indexes documents and computes token frequencies accurately', () => {
    bm25.clear();
    const count = bm25.addChunks(sampleCorpus);
    assert.strictEqual(count, 3);
    assert.strictEqual(bm25.totalDocs, 3);
    assert.ok(bm25.avgDocLength > 0);

    const stats = bm25.getStats();
    assert.strictEqual(stats.totalDocs, 3);
    assert.ok(stats.vocabularySize > 10);
  });

  test('2. Inverse Document Frequency (IDF) scoring reflects rarity', () => {
    // "API-653" appears in only 1 document -> Higher IDF
    const idfApi653 = bm25.idf('api-653');
    // "standard" appears in 2 documents -> Lower IDF
    const idfStandard = bm25.idf('standard');

    assert.ok(idfApi653 > idfStandard, `Rare term IDF (${idfApi653.toFixed(4)}) should exceed common term IDF (${idfStandard.toFixed(4)})`);
    assert.ok(idfApi653 > 0, 'IDF must be strictly positive');
  });

  test('3. Exact symbol and decimal number lexical matching', () => {
    // Query with exact decimal "6.80" and symbol "API-653"
    const results = bm25.search('API-653 6.80 mm', { topK: 3 });

    assert.ok(results.length > 0);
    assert.strictEqual(results[0].chunkId, 'chk_sop_001');
    assert.ok(results[0].bm25Score > 1.0);
    assert.ok(results[0].text.includes('6.80 mm'));
    assert.ok(results[0].text.includes('API-653'));

    // Query with exact port number "8300"
    const portResults = bm25.search('PORT 8300', { topK: 3 });
    assert.ok(portResults.length > 0);
    assert.strictEqual(portResults[0].chunkId, 'chk_gate_001');
  });

  test('4. Case folding, punctuation handling, and sub-tokenization', () => {
    // Query with uppercase and hyphens
    const resUpper = bm25.search('OISD-STD-129 7.0 KG/CM2', { topK: 2 });
    assert.ok(resUpper.length > 0);
    assert.strictEqual(resUpper[0].chunkId, 'chk_sop_002');

    // Query with lowercase subtoken
    const resSub = bm25.search('oisd 129', { topK: 2 });
    assert.ok(resSub.length > 0);
    assert.strictEqual(resSub[0].chunkId, 'chk_sop_002');
  });

  test('5. Scopes search by namespace and documentId filters', () => {
    const projResults = bm25.search('default gateway listener', {
      namespace: IngestionNamespace.PROJECT
    });
    assert.strictEqual(projResults.length, 1);
    assert.strictEqual(projResults[0].chunkId, 'chk_gate_001');

    const globalResults = bm25.search('default gateway listener', {
      namespace: IngestionNamespace.GLOBAL
    });
    assert.strictEqual(globalResults.length, 0);
  });

  test('6. Removes document and updates inverted index cleanly', () => {
    const removed = bm25.removeDocument('doc_sop_001');
    assert.strictEqual(removed, 1);
    assert.strictEqual(bm25.totalDocs, 2);

    const searchDeleted = bm25.search('API-653 6.80 mm');
    assert.strictEqual(searchDeleted.length, 0);
  });

  test('7. Handles empty, whitespace, or non-matching queries gracefully', () => {
    assert.deepStrictEqual(bm25.search(''), []);
    assert.deepStrictEqual(bm25.search('   '), []);
    assert.deepStrictEqual(bm25.search('nonexistent_gibberish_term_xyz_999'), []);
  });
});
