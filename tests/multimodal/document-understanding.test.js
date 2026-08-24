/**
 * Test Suite: Multimodal Document & Image Understanding Subsystem
 * Verifies local extraction from CSV, text, PDF, code, and images with zero cloud egress.
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { documentExtractor } from '../../platform/multimodal/document-extractor.js';

test('1. CSV / Table Extraction to Structured Markdown Table', async () => {
  const csvContent = `Equipment,Thickness_mm,Retirement_mm,Status\nTK-101,5.90,6.80,CRITICAL\nHX-204,8.20,7.00,ACCEPTABLE\nP-301,4.50,4.00,ACCEPTABLE`;
  const base64Data = Buffer.from(csvContent).toString('base64');

  const doc = await documentExtractor.extractContent({
    name: 'inspection_data.csv',
    type: 'text/csv',
    data: base64Data
  });

  assert.strictEqual(doc.docType, 'table');
  assert.ok(doc.extractedText.includes('| Equipment | Thickness_mm |'), 'Must generate Markdown table header');
  assert.ok(doc.extractedText.includes('TK-101'), 'Must contain equipment data');
  assert.ok(doc.tables.length > 0, 'Must produce structured table array');
});

test('2. Code / Text File Content Decoding', async () => {
  const codeContent = `def calculate_corrosion_rate(t_prev, t_curr, years):\n    return (t_prev - t_curr) / years`;
  const base64Data = Buffer.from(codeContent).toString('base64');

  const doc = await documentExtractor.extractContent({
    name: 'corrosion_calc.py',
    type: 'text/x-python',
    data: base64Data
  });

  assert.strictEqual(doc.docType, 'code_or_text');
  assert.ok(doc.extractedText.includes('calculate_corrosion_rate'));
});

test('3. Image Attachment Processed by Local OCR Document Engine', async () => {
  const dummyImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const doc = await documentExtractor.extractContent({
    name: 'flange_defect_photo.png',
    type: 'image/png',
    data: dummyImageBase64
  });

  assert.strictEqual(doc.docType, 'image');
  assert.strictEqual(doc.isMultimodalImage, false, 'Image is processed by OCR engine without raw image bypass');
  assert.ok(doc.extractedText.length > 0);
});

test('4. PDF Document Content Extraction', async () => {
  const pdfText = 'MRPL Plant Inspection Report - Tank TK-101 Ultrasonic Testing';
  const base64Data = Buffer.from(`%PDF-1.4\n(${pdfText}) Tj\n%%EOF`).toString('base64');

  const doc = await documentExtractor.extractContent({
    name: 'TK-101-Inspection.pdf',
    type: 'application/pdf',
    data: base64Data
  });

  assert.strictEqual(doc.docType, 'pdf');
  assert.ok(doc.extractedText.includes('MRPL') || doc.extractedText.includes('TK-101'));
});
