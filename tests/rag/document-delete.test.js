import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { 
  HybridRetriever, 
  VectorIndex, 
  BM25Index, 
  IngestionNamespace 
} from '../../platform/rag/index.js';

describe('RAG Subsystem — 11. Document Deletion & Index Purge Test Suite', () => {
  const vIndex = new VectorIndex({ storageDir: 'data/rag/test_delete_v' });
  const bIndex = new BM25Index();
  const hybrid = new HybridRetriever({ vectorIndex: vIndex, bm25Index: bIndex });

  const docADocId = 'doc_api_653_inspection';
  const docBDocId = 'doc_oisd_129_fire';

  const chunks = [
    {
      chunkId: 'chk_a_01',
      documentId: docADocId,
      filename: 'API-653.pdf',
      namespace: IngestionNamespace.GLOBAL,
      heading: 'Course 3 Limits',
      text: 'API-653 Tank Shell Course 3 minimum thickness is 6.80 mm.',
      enrichedText: '[Document: API-653.pdf] API-653 Tank Shell Course 3 minimum thickness is 6.80 mm.',
      pageNumber: 14
    },
    {
      chunkId: 'chk_a_02',
      documentId: docADocId,
      filename: 'API-653.pdf',
      namespace: IngestionNamespace.GLOBAL,
      heading: 'Bottom Plate Inspection',
      text: 'API-653 Tank Bottom Plate minimum thickness limit is 2.50 mm before replacement.',
      enrichedText: '[Document: API-653.pdf] API-653 Tank Bottom Plate thickness 2.50 mm.',
      pageNumber: 18
    },
    {
      chunkId: 'chk_b_01',
      documentId: docBDocId,
      filename: 'OISD-129.pdf',
      namespace: IngestionNamespace.GLOBAL,
      heading: 'Fire Water Main',
      text: 'OISD-STD-129 requires minimum fire water pressure of 7.0 kg/cm2.',
      enrichedText: '[Document: OISD-129.pdf] OISD-STD-129 fire water pressure 7.0 kg/cm2.',
      pageNumber: 4
    }
  ];

  test('1. Setup: Indexes multiple documents with multiple chunks', async () => {
    await hybrid.clear();
    const count = await hybrid.addChunks(chunks);
    assert.strictEqual(count, 3);

    const checkA = hybrid.search('API-653 minimum thickness 6.80 mm');
    assert.ok(checkA.some(r => r.documentId === docADocId));

    const checkB = hybrid.search('OISD-STD-129 fire water pressure');
    assert.ok(checkB.some(r => r.documentId === docBDocId));
  });

  test('2. Deletes document A and purges all chunks from Vector and BM25 indexes', async () => {
    const removedCount = await hybrid.removeDocument(docADocId);
    assert.ok(removedCount >= 2, `Expected at least 2 chunks removed, got ${removedCount}`);

    // Verify Vector Search no longer returns Doc A
    const vResults = vIndex.search('API-653 Course 3 minimum thickness 6.80 mm');
    assert.ok(!vResults.some(r => r.documentId === docADocId), 'Vector index must not contain Doc A');

    // Verify BM25 Search no longer returns Doc A
    const bResults = bIndex.search('API-653 Course 3 minimum thickness 6.80 mm');
    assert.ok(!bResults.some(r => r.documentId === docADocId), 'BM25 index must not contain Doc A');

    // Verify Hybrid Search no longer returns Doc A
    const hResults = hybrid.search('API-653 Course 3 minimum thickness 6.80 mm');
    assert.ok(!hResults.some(r => r.documentId === docADocId), 'Hybrid search must not return Doc A');
  });

  test('3. Document B remains intact and fully searchable after Document A deletion', () => {
    const bResults = hybrid.search('OISD-STD-129 fire water ring main pressure 7.0 kg/cm2');
    assert.ok(bResults.length > 0);
    assert.strictEqual(bResults[0].documentId, docBDocId);
    assert.ok(bResults[0].text.includes('7.0 kg/cm2'));
  });

  test('4. Idempotency: deleting a non-existent document ID returns 0 and does not error', async () => {
    const res = await hybrid.removeDocument('doc_non_existent_99999');
    assert.strictEqual(res, 0);

    const bResults = hybrid.search('OISD-STD-129');
    assert.ok(bResults.length > 0);
  });
});
