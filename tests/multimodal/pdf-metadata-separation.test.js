import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { documentExtractor } from '../../platform/multimodal/document-extractor.js';

test('2. PDF Metadata Separation isolates metadata from primary content', async () => {
  const filePath = path.resolve('tests/multimodal/fixtures/project-review-request-fixed.pdf');
  const buffer = fs.readFileSync(filePath);
  const base64Data = buffer.toString('base64');

  const doc = await documentExtractor.extractContent({
    name: 'project_review_request_fixed.pdf',
    type: 'application/pdf',
    data: base64Data
  });

  // Content text should be clean
  assert.ok(
    doc.contentText.includes('Write a professional email to my manager requesting a project review'),
    'Content text must contain the body text'
  );
  assert.ok(
    !doc.contentText.includes('c2pa'),
    'Content text must not contain c2pa'
  );

  // Metadata text should contain metadata details
  assert.ok(
    doc.metadataText.length > 0,
    'Metadata text should be populated separately'
  );
  assert.ok(
    doc.metadataText.includes('Producer: Acme PDF Engine') || doc.metadataText.includes('XMP Metadata') || doc.metadataText.includes('C2PA'),
    'Metadata text must capture technical document metadata'
  );
});
