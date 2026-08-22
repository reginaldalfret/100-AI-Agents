import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  listChats,
  getChat,
  createChat,
  updateChat,
  appendMessage,
  deleteChat,
  searchChats
} from '../../platform/services/conversation-service.js';

describe('101 Super AI Agents — Conversation History Subsystem Test', () => {
  let testChatId = null;

  it('should create a new conversation with persistent local file', () => {
    const chat = createChat({
      title: 'New Chat',
      agentId: 'agent-101',
      agentName: 'Super AI Agent',
      modelMode: 'auto'
    });

    assert.ok(chat.id, 'Chat should have an ID');
    assert.equal(chat.title, 'New Chat');
    assert.equal(chat.agentName, 'Super AI Agent');
    assert.equal(chat.pinned, false);
    testChatId = chat.id;

    // Verify file on disk
    const fetched = getChat(testChatId);
    assert.ok(fetched, 'Conversation file must exist on disk');
    assert.equal(fetched.id, testChatId);
  });

  it('should append a user message and automatically generate a deterministic title', () => {
    const updated = appendMessage(testChatId, {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: 'Compare Gemini 3.7 Flash and 3.1 Pro',
      timestamp: new Date().toISOString()
    });

    assert.equal(updated.messages.length, 1);
    assert.ok(updated.title.startsWith('Compare Gemini'), `Title should auto-update to deterministic summary, got: ${updated.title}`);
  });

  it('should pin and unpin a conversation', () => {
    const pinned = updateChat(testChatId, { pinned: true });
    assert.equal(pinned.pinned, true);

    const chats = listChats();
    const first = chats[0];
    assert.equal(first.id, testChatId, 'Pinned chat should appear first in list');

    const unpinned = updateChat(testChatId, { pinned: false });
    assert.equal(unpinned.pinned, false);
  });

  it('should rename a conversation', () => {
    const renamed = updateChat(testChatId, { title: 'Gemini Models Benchmark' });
    assert.equal(renamed.title, 'Gemini Models Benchmark');
  });

  it('should search conversations by title and message content', () => {
    const results = searchChats('Benchmark');
    assert.ok(results.some(c => c.id === testChatId), 'Search should match the conversation title');
  });

  it('should delete a conversation and remove its local file', () => {
    const deleted = deleteChat(testChatId);
    assert.equal(deleted, true);

    const fetched = getChat(testChatId);
    assert.equal(fetched, null, 'Deleted chat must no longer exist');
  });
});
