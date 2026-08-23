import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'http://127.0.0.1:8300';

test('Integration: Reject request with empty task and no attachments', async () => {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      task: '',
      attachments: [],
      stream: false
    })
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.status, 'error');
  assert.match(data.error, /task or attachment is required/i);
});

test('Integration: Accept PDF-only attachment with empty task', async () => {
  const pdfFixturePath = path.resolve('tests/multimodal/fixtures/project-review-request-fixed.pdf');
  const pdfBase64 = fs.readFileSync(pdfFixturePath).toString('base64');

  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      task: '',
      message: '',
      inputMode: 'attachment',
      attachments: [{
        name: 'project_review_request_fixed.pdf',
        type: 'application/pdf',
        data: pdfBase64
      }],
      stream: false
    })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'success');
  const text = typeof data.result === 'string' ? data.result : (data.text || data.result?.synthesis || '');
  assert.ok(text.length > 0, 'Should return non-empty response for PDF-only');
  assert.doesNotMatch(text, /c2pa manifest|credential validation/i);
});

test('Integration: Accept Image-only attachment with empty task', async () => {
  const redPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      task: '',
      message: '',
      inputMode: 'attachment',
      attachments: [{
        name: 'test_red_square.png',
        type: 'image/png',
        data: redPngBase64
      }],
      stream: false
    })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'success');
  const text = typeof data.result === 'string' ? data.result : (data.text || data.result?.synthesis || '');
  assert.ok(text.length > 0, 'Should return non-empty response for Image-only');
});

test('Integration: Accept DOCX-only / CSV-only attachment with empty task', async () => {
  const csvBase64 = Buffer.from('Equipment,Vibration,Status\nPUMP-101,1.2,Normal\nPUMP-102,4.8,Warning\n').toString('base64');

  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      task: '',
      message: '',
      inputMode: 'attachment',
      attachments: [{
        name: 'pump_vibration_log.csv',
        type: 'text/csv',
        data: csvBase64
      }],
      stream: false
    })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'success');
  const text = typeof data.result === 'string' ? data.result : (data.text || data.result?.synthesis || '');
  assert.ok(text.length > 0, 'Should return non-empty response for CSV-only');
});
