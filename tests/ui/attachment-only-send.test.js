import test from 'node:test';
import assert from 'node:assert/strict';

// Logic mirror of the canonical frontend updateSendButtonState implementation
function evaluateSendReadiness({ text = '', attachments = [], isGenerating = false, voiceTranscript = '' }) {
  if (isGenerating) {
    return { canSend: true, mode: 'stop' };
  }

  const textVal = (text || '').trim();
  const hasText = textVal.length > 0;
  const hasVoice = (voiceTranscript || '').trim().length > 0;
  const readyAttachments = (attachments || []).filter(a => a.status === 'ready');
  const hasReadyAttachments = readyAttachments.length > 0;
  const hasProcessing = (attachments || []).some(a => a.status === 'processing');

  const canSend = (hasText || hasReadyAttachments || hasVoice) && !hasProcessing;
  return { canSend, mode: 'send' };
}

test('1. empty composer + no attachment -> Send disabled', () => {
  const state = evaluateSendReadiness({ text: '', attachments: [] });
  assert.equal(state.canSend, false);
});

test('2. text only -> Send enabled', () => {
  const state = evaluateSendReadiness({ text: 'Hello AI Agent', attachments: [] });
  assert.equal(state.canSend, true);
});

test('3. ready PDF only -> Send enabled', () => {
  const state = evaluateSendReadiness({
    text: '',
    attachments: [{ name: 'project_review_request_fixed.pdf', type: 'application/pdf', status: 'ready' }]
  });
  assert.equal(state.canSend, true);
});

test('4. ready image only -> Send enabled', () => {
  const state = evaluateSendReadiness({
    text: '',
    attachments: [{ name: 'photo.png', type: 'image/png', status: 'ready' }]
  });
  assert.equal(state.canSend, true);
});

test('5. ready DOCX only -> Send enabled', () => {
  const state = evaluateSendReadiness({
    text: '',
    attachments: [{ name: 'specification.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', status: 'ready' }]
  });
  assert.equal(state.canSend, true);
});

test('6. ready XLSX only -> Send enabled', () => {
  const state = evaluateSendReadiness({
    text: '',
    attachments: [{ name: 'financials.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', status: 'ready' }]
  });
  assert.equal(state.canSend, true);
});

test('7. ready CSV only -> Send enabled', () => {
  const state = evaluateSendReadiness({
    text: '',
    attachments: [{ name: 'sensor_logs.csv', type: 'text/csv', status: 'ready' }]
  });
  assert.equal(state.canSend, true);
});

test('8. processing attachment only -> Send disabled', () => {
  const state = evaluateSendReadiness({
    text: '',
    attachments: [{ name: 'large_video.mp4', type: 'video/mp4', status: 'processing' }]
  });
  assert.equal(state.canSend, false);
});

test('9. failed attachment only -> Send disabled', () => {
  const state = evaluateSendReadiness({
    text: '',
    attachments: [{ name: 'corrupted.bin', type: 'application/octet-stream', status: 'failed' }]
  });
  assert.equal(state.canSend, false);
});

test('10. text + attachment -> Send enabled', () => {
  const state = evaluateSendReadiness({
    text: 'Please review this',
    attachments: [{ name: 'report.pdf', type: 'application/pdf', status: 'ready' }]
  });
  assert.equal(state.canSend, true);
});

test('11. voice transcript only -> Send enabled', () => {
  const state = evaluateSendReadiness({
    text: '',
    attachments: [],
    voiceTranscript: 'Analyze this pump diagnostic'
  });
  assert.equal(state.canSend, true);
});

test('12. multiple ready attachments -> Send enabled', () => {
  const state = evaluateSendReadiness({
    text: '',
    attachments: [
      { name: 'report.pdf', type: 'application/pdf', status: 'ready' },
      { name: 'diagram.png', type: 'image/png', status: 'ready' }
    ]
  });
  assert.equal(state.canSend, true);
});
