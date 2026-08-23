import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { 
  documentIngestion, 
  DocumentIngestion, 
  SupportedMimeTypes, 
  IngestionNamespace 
} from '../../platform/rag/index.js';

describe('RAG Subsystem — 1. Document Ingestion & Normalization Test Suite', () => {
  const ingestion = new DocumentIngestion();

  test('1. Ingests and normalizes CSV tabular datasets with delimiter auto-detection', async () => {
    const csvContent = [
      'equipment_id,tag_number,service,design_pressure_psi,corrosion_rate_mpy',
      'TK-101,V-001,Crude Storage,15.5,2.4',
      'TK-102,V-002,Vacuum Residue,25.0,4.1',
      'TK-103,V-003,Naphtha Splitter,45.2,1.8'
    ].join('\n');

    const doc = await ingestion.ingestBuffer(csvContent, 'equipment_register.csv', SupportedMimeTypes.CSV, {
      namespace: IngestionNamespace.PROJECT,
      tags: ['refinery', 'equipment', 'api-653']
    });

    assert.ok(doc.documentId.startsWith('doc_'));
    assert.strictEqual(doc.filename, 'equipment_register.csv');
    assert.strictEqual(doc.fileType, 'csv');
    assert.strictEqual(doc.mimeType, SupportedMimeTypes.CSV);
    assert.strictEqual(doc.namespace, IngestionNamespace.PROJECT);
    assert.ok(doc.sha256 && doc.sha256.length === 64);
    assert.strictEqual(doc.tags.length, 3);
    assert.strictEqual(doc.tables.length, 1);
    assert.strictEqual(doc.tables[0].rows.length, 3);
    assert.strictEqual(doc.tables[0].headers.length, 5);
    assert.strictEqual(doc.tables[0].rows[0].equipment_id, 'TK-101');
    assert.strictEqual(doc.tables[0].rows[1].design_pressure_psi, '25.0');
    assert.ok(doc.rawText.includes('| TK-101 | V-001 |'));
  });

  test('2. Ingests and normalizes TSV tab-separated values correctly', async () => {
    const tsvContent = [
      'parameter\tstandard_limit\tmeasured_value\tunit',
      'Shell Thickness\t6.80\t7.15\tmm',
      'Bottom Plate\t2.50\t2.85\tmm'
    ].join('\n');

    const doc = await ingestion.ingestBuffer(tsvContent, 'thickness_report.tsv', SupportedMimeTypes.TSV);
    assert.strictEqual(doc.fileType, 'tsv');
    assert.strictEqual(doc.tables.length, 1);
    assert.strictEqual(doc.tables[0].headers[0], 'parameter');
    assert.strictEqual(doc.tables[0].rows[0].standard_limit, '6.80');
  });

  test('3. Ingests and normalizes PDF documents with simulated FlateDecode streams', async () => {
    // Generate a synthetic PDF buffer with text operators and stream
    const pdfText = 'API 653 Tank Inspection Standard Minimum Thickness 6.80 mm Section 4.3.3';
    const compressedStream = zlib.deflateSync(Buffer.from(`BT /F1 12 Tf (${pdfText}) Tj ET`, 'utf8'));

    const header = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Page >>\nendobj\n2 0 obj\n<< /Filter /FlateDecode >>\nstream\r\n', 'latin1');
    const footer = Buffer.from('\r\nendstream\nendobj\n%%EOF', 'latin1');
    const pdfBuffer = Buffer.concat([header, compressedStream, footer]);

    const doc = await ingestion.ingestBuffer(pdfBuffer, 'api_653_standard.pdf', SupportedMimeTypes.PDF, {
      namespace: IngestionNamespace.GLOBAL,
      customMetadata: { standard: 'API-653', edition: '5th' }
    });

    assert.strictEqual(doc.fileType, 'pdf');
    assert.strictEqual(doc.mimeType, SupportedMimeTypes.PDF);
    assert.ok(doc.pageCount >= 1);
    assert.ok(doc.sections.length > 0);
    assert.strictEqual(doc.customMetadata.standard, 'API-653');
    assert.ok(doc.rawText.includes('API 653') || doc.sections.some(s => s.content.includes('API 653')));
  });

  test('4. Ingests source code files (JS/TS/Python) extracting symbol ranges', async () => {
    const jsCode = [
      '/**',
      ' * Calculates minimum retirement thickness per API-653',
      ' */',
      'export function calculateRetirementThickness(radius, height, stress) {',
      '  const g = 0.98;',
      '  const tMin = (2.6 * radius * (height - 1) * g) / stress;',
      '  return Math.max(tMin, 2.5);',
      '}',
      '',
      'export class TankCorrosionModel {',
      '  constructor(tankId) {',
      '    this.tankId = tankId;',
      '  }',
      '',
      '  estimateRemainingLife(currentThickness, tMin, corrosionRate) {',
      '    if (corrosionRate <= 0) return 999;',
      '    return (currentThickness - tMin) / corrosionRate;',
      '  }',
      '}'
    ].join('\n');

    const doc = await ingestion.ingestBuffer(jsCode, 'corrosion_model.js', SupportedMimeTypes.JAVASCRIPT);

    assert.strictEqual(doc.fileType, 'js');
    assert.strictEqual(doc.mimeType, SupportedMimeTypes.JAVASCRIPT);
    assert.ok(doc.codeSymbols.length >= 2);
    
    const funcSym = doc.codeSymbols.find(s => s.name === 'calculateRetirementThickness');
    assert.ok(funcSym, 'Function symbol found');
    assert.strictEqual(funcSym.startLine, 4);
    assert.ok(funcSym.endLine >= 8);

    const classSym = doc.codeSymbols.find(s => s.name === 'TankCorrosionModel');
    assert.ok(classSym, 'Class symbol found');
    assert.strictEqual(classSym.startLine, 10);
    assert.ok(classSym.endLine >= 18);
  });

  test('5. Ingests multimodal Gemma 3 vision observations with OCR and bounding boxes', () => {
    const obs = {
      filename: 'p_and_id_tk101.png',
      caption: 'P&ID diagram showing tank TK-101 inlet lines and relief valves',
      observations: [
        'Valve PSV-101 set pressure is rated at 150 PSI',
        'Inlet nozzle N1 connects to line 8"-CR-101-CS',
        'Emergency vent conservation vent rated for 2.5 oz/in2'
      ],
      ocrText: 'TK-101 CRUDE STORAGE CAPACITY 50000 BBL PSV-101 SET 150 PSI',
      boundingBoxes: [
        { label: 'PSV-101', box_2d: [120, 340, 180, 420] },
        { label: 'TK-101', box_2d: [300, 200, 700, 600] }
      ],
      dimensions: { width: 1920, height: 1080 }
    };

    const doc = ingestion.ingestMultimodalObservation(obs, {
      namespace: IngestionNamespace.ATTACHMENT,
      tags: ['p_and_id', 'safety_valves']
    });

    assert.ok(doc.documentId.startsWith('img_'));
    assert.strictEqual(doc.fileType, 'image_observation');
    assert.strictEqual(doc.mimeType, SupportedMimeTypes.IMAGE_OBSERVATION);
    assert.strictEqual(doc.namespace, IngestionNamespace.ATTACHMENT);
    assert.ok(doc.rawText.includes('PSV-101 set pressure'));
    assert.ok(doc.rawText.includes('TK-101 CRUDE STORAGE'));
    assert.strictEqual(doc.customMetadata.boundingBoxes.length, 2);
    assert.strictEqual(doc.sections.length, 2);
  });

  test('6. SHA-256 deduplication: identical payloads generate identical hashes and consistent IDs', async () => {
    const textData = 'Refinery Safety Operating Procedure: Hot Work Permit Gas Test Threshold 0.0% LEL';
    
    const doc1 = await ingestion.ingestBuffer(textData, 'sop_hot_work.txt', SupportedMimeTypes.PLAIN_TEXT);
    const doc2 = await ingestion.ingestBuffer(textData, 'sop_hot_work_copy.txt', SupportedMimeTypes.PLAIN_TEXT);

    const expectedHash = crypto.createHash('sha256').update(textData).digest('hex');
    assert.strictEqual(doc1.sha256, expectedHash);
    assert.strictEqual(doc2.sha256, expectedHash);
    assert.strictEqual(doc1.documentId, doc2.documentId);
  });

  test('7. Enforces error handling for empty buffers and invalid inputs', async () => {
    await assert.rejects(
      async () => await ingestion.ingestBuffer(Buffer.alloc(0), 'empty.txt'),
      /Cannot ingest empty document/
    );

    await assert.rejects(
      async () => await ingestion.ingestFile('./non_existent_file_xyz_123.pdf'),
      /ENOENT|Invalid path/
    );
  });
});
