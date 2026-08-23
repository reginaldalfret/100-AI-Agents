import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { 
  VectorIndex, 
  IngestionNamespace 
} from '../../platform/rag/index.js';

describe('RAG Subsystem — 4. Persistent Local Vector Index Test Suite', () => {
  const index = new VectorIndex({
    storageDir: 'data/rag/test_vectors'
  });

  const sampleChunks = [
    {
      chunkId: 'doc_api653_chk_0001',
      documentId: 'doc_api653',
      filename: 'api_653_standard.pdf',
      namespace: IngestionNamespace.GLOBAL,
      fileType: 'pdf',
      heading: 'Course 3 Retirement Limit',
      text: 'According to API-653 standard, Tank Shell Course 3 minimum thickness is 6.80 mm.',
      enrichedText: '[Document: api_653_standard.pdf | Section: Course 3] Tank Shell Course 3 minimum thickness is 6.80 mm.',
      pageNumber: 14
    },
    {
      chunkId: 'doc_oisd_chk_0001',
      documentId: 'doc_oisd129',
      filename: 'oisd_129_standard.pdf',
      namespace: IngestionNamespace.GLOBAL,
      fileType: 'pdf',
      heading: 'Fire Water Network Design',
      text: 'OISD-STD-129 requires minimum fire water ring main pressure of 7.0 kg/cm2 at the remotest point.',
      enrichedText: '[Document: oisd_129_standard.pdf | Section: Fire Water] OISD-STD-129 minimum fire water pressure 7.0 kg/cm2.',
      pageNumber: 8
    },
    {
      chunkId: 'doc_proj_chk_0001',
      documentId: 'doc_maint_2026',
      filename: 'turnaround_plan_2026.docx',
      namespace: IngestionNamespace.PROJECT,
      fileType: 'docx',
      heading: 'Vacuum Distillation Unit Turnaround',
      text: 'Major overhaul of crude pre-heat train heat exchangers scheduled for Q3 2026 shutdown.',
      enrichedText: '[Document: turnaround_plan_2026.docx | Section: VDU] Major overhaul of crude pre-heat train heat exchangers Q3 2026.',
      pageNumber: 2
    },
    {
      chunkId: 'doc_att_chk_0001',
      documentId: 'doc_img_leak',
      filename: 'flange_leak_obs.png',
      namespace: IngestionNamespace.ATTACHMENT,
      fileType: 'image_observation',
      heading: 'Visual Observation: Flange Leak',
      text: 'Visual inspection shows severe steam tracing line leak near valve FV-204 on tower overhead.',
      enrichedText: '[Document: flange_leak_obs.png | Section: Flange Leak] Severe steam tracing line leak near valve FV-204.',
      pageNumber: 1
    }
  ];

  test('1. Inserts chunks and builds in-memory vector index', async () => {
    await index.clear();
    const count = await index.addChunks(sampleChunks);
    assert.strictEqual(count, 4);

    const stats = index.getStats();
    assert.strictEqual(stats.totalChunks, 4);
    assert.strictEqual(stats.totalDocuments, 4);
    assert.strictEqual(stats.dimension, 384);
  });

  test('2. Performs dense semantic search returning ranked results', () => {
    const results = index.search('What is the minimum retirement thickness for tank shell course 3?', {
      topK: 2
    });

    assert.ok(results.length > 0);
    assert.strictEqual(results[0].documentId, 'doc_api653');
    assert.strictEqual(results[0].chunkId, 'doc_api653_chk_0001');
    assert.ok(results[0].vectorScore > 0.6);
    assert.ok(results[0].text.includes('6.80 mm'));
  });

  test('3. Enforces strict namespace partitioning and filtering', () => {
    // Global namespace search
    const globalResults = index.search('overhaul heat exchangers', {
      namespace: IngestionNamespace.GLOBAL,
      topK: 5
    });
    // Should NOT find PROJECT chunk
    assert.ok(!globalResults.some(r => r.namespace === IngestionNamespace.PROJECT));

    // Project namespace search
    const projectResults = index.search('overhaul heat exchangers', {
      namespace: IngestionNamespace.PROJECT,
      topK: 5
    });
    assert.ok(projectResults.length > 0);
    assert.strictEqual(projectResults[0].namespace, IngestionNamespace.PROJECT);
    assert.strictEqual(projectResults[0].documentId, 'doc_maint_2026');

    // Attachment namespace search
    const attResults = index.search('steam tracing line leak valve', {
      namespace: IngestionNamespace.ATTACHMENT,
      topK: 5
    });
    assert.ok(attResults.length > 0);
    assert.strictEqual(attResults[0].documentId, 'doc_img_leak');
  });

  test('4. Filters search by documentId, fileType, and custom predicate', () => {
    const pdfResults = index.search('fire water or tank thickness', {
      fileType: 'pdf',
      topK: 10
    });
    assert.ok(pdfResults.every(r => r.fileType === 'pdf'));

    const customFiltered = index.search('standard pressure limit', {
      filter: (chk) => chk.pageNumber >= 10
    });
    assert.ok(customFiltered.every(r => r.pageNumber >= 10));
    assert.ok(customFiltered.some(r => r.documentId === 'doc_api653'));
  });

  test('5. Removes document by documentId cleaning index completely', async () => {
    const removedCount = await index.removeDocument('doc_api653');
    assert.strictEqual(removedCount, 1);

    const searchAfterDelete = index.search('API-653 minimum thickness 6.80 mm', {
      topK: 5
    });
    assert.ok(!searchAfterDelete.some(r => r.documentId === 'doc_api653'));

    const stats = index.getStats();
    assert.strictEqual(stats.totalChunks, 3);
  });
});
