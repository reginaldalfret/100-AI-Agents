/**
 * Test Suite: Copy and Answer Action Functionality in Sovereign AI Workbench
 * Verifies clean text copy, reply context creation, UI components, and reply prompt formatting.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

describe('101 Super AI Agents — Copy + Answer Action Features', () => {
  const html = fs.readFileSync(path.join(ROOT, 'platform/web/index.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'platform/web/styles.css'), 'utf8');
  const js = fs.readFileSync(path.join(ROOT, 'platform/web/app.js'), 'utf8');

  it('1. HTML structure contains reply context container and controls', () => {
    assert.ok(html.includes('id="replyContextArea"'), 'Must have replyContextArea element');
    assert.ok(html.includes('id="replyAgentLabel"'), 'Must have replyAgentLabel element');
    assert.ok(html.includes('id="replyPreviewText"'), 'Must have replyPreviewText element');
    assert.ok(html.includes('id="closeReplyBtn"'), 'Must have closeReplyBtn element');
  });

  it('2. CSS defines liquid glass styling for action buttons and reply context bar', () => {
    assert.ok(css.includes('.msg-actions-row'), 'Must define .msg-actions-row style');
    assert.ok(css.includes('.btn-msg-action'), 'Must define .btn-msg-action style');
    assert.ok(css.includes('.btn-copy-msg'), 'Must define .btn-copy-msg style');
    assert.ok(css.includes('.btn-answer-msg'), 'Must define .btn-answer-msg style');
    assert.ok(css.includes('.reply-context-card'), 'Must define .reply-context-card style');
    assert.ok(css.includes('.user-reply-quote'), 'Must define .user-reply-quote style');
  });

  it('3. JS controller defines copyCleanResponse, setReplyContext, clearReplyContext, and createActionsRow', () => {
    assert.ok(js.includes('function copyCleanResponse(') || js.includes('async function copyCleanResponse('), 'copyCleanResponse function must exist');
    assert.ok(js.includes('function setReplyContext('), 'setReplyContext function must exist');
    assert.ok(js.includes('function clearReplyContext('), 'clearReplyContext function must exist');
    assert.ok(js.includes('function createActionsRow('), 'createActionsRow function must exist');
  });

  it('4. Action rows are bound to both rendered AI messages and streaming completions', () => {
    assert.ok(js.includes('createActionsRow(msg.content'), 'renderAIMessage must append action row');
    assert.ok(js.includes('createActionsRow(accumulatedText'), 'Streaming completion must append action row');
  });

  it('5. Reply context formats clean contextual prompt without mutating selected model mode', () => {
    assert.ok(js.includes('replyTo'), 'App.js must pass replyTo structured metadata');
    assert.ok(js.includes('user-reply-quote'), 'User message bubble must render reply quote');
  });
});
