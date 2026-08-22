import test from 'node:test';
import assert from 'node:assert/strict';
import * as DocumentService from '../platform/services/document-service.js';

test('Document Classification: Valid formats succeed and unsupported files are flagged', async () => {
  const validPdf = await DocumentService.classifyDocument({
    filename: 'transcript.pdf',
    mimeType: 'application/pdf'
  });
  assert.equal(validPdf.status, 'VALID');
  assert.equal(validPdf.documentType, 'academic_transcript');

  const unsupportedExe = await DocumentService.classifyDocument({
    filename: 'malicious.exe',
    mimeType: 'application/x-msdownload'
  });
  assert.equal(unsupportedExe.status, 'UNSUPPORTED_FILE_TYPE');
  assert.equal(unsupportedExe.isSupported, false);
});

test('Document Extraction & Verification: Genuine extraction and corruption detection', async () => {
  // 1. Genuine mark sheet extraction
  const marksheet = await DocumentService.extractDocumentData('DOC-DEMO-001-MARKSHEET');
  assert.equal(marksheet.status, 'SUCCESS');
  assert.equal(marksheet.extractedData.gpa, 3.90);

  // 2. Corrupted file handling (no hallucinations)
  const corrupt = await DocumentService.extractDocumentData('DOC-CORRUPT-001');
  assert.equal(corrupt.status, 'ERROR');
  assert.ok(corrupt.error.includes('Unreadable'));

  // 3. Verification hash validation
  const verified = await DocumentService.verifyDocument('DOC-DEMO-001-MARKSHEET');
  assert.equal(verified.status, 'verified');
  assert.equal(verified.verified, true);
});

test('Data Conflict Detection: Identifies discrepancies between DB and uploaded certificate', async () => {
  const dbIncome = 180000;
  const docIncome = 120000;

  const conflictCheck = DocumentService.detectDataConflict({
    dbValue: dbIncome,
    docValue: docIncome,
    fieldName: 'annual_income'
  });

  assert.equal(conflictCheck.conflict, true);
  assert.equal(conflictCheck.status, 'DATA_CONFLICT_ESCALATED');
  assert.equal(conflictCheck.difference, 60000);
  assert.ok(conflictCheck.recommendation.includes('Financial Aid Committee'));
});

test('Document Comparison: Mismatched student documents flagged', async () => {
  const comparison = await DocumentService.compareDocuments('DOC-8001', 'DOC-8002');
  assert.equal(comparison.consistent, false);
  assert.ok(comparison.matchSummary.includes('Mismatch'));
});
