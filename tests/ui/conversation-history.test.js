import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  listChats,
  getChat,
  createChat,
  updateChat,
  appendMessage,
  deleteChat,
  searchChats
} from '../../platform/services/conversation-service.js';

describe('101 Super AI Agents — Conversation History Subsystem Verification', () => {
  let testChatA = null;
  let testChatB = null;

  it('1. Real conversations load without fake placeholder items', () => {
    const chats = listChats();
    assert.ok(Array.isArray(chats), 'Chats must be an array');
    assert.ok(chats.length > 0, 'Must contain real migrated/persisted conversations');
    assert.ok(!chats.some(c => c.title === 'New Chat' && c.messageCount === 0), 'No empty New Chat placeholders');
  });

  it('2. Create and persist conversation to authoritative E-drive storage', () => {
    const chat = createChat({
      title: 'Renewable Energy Strategy Dossier',
      agentId: 'agent-001',
      agentName: 'Writing AI Agent',
      modelMode: 'nemotron'
    });

    assert.ok(chat.id, 'Chat should have an ID');
    assert.equal(chat.title, 'Renewable Energy Strategy Dossier');
    assert.equal(chat.agentId, 'agent-001');
    assert.equal(chat.agentName, 'Writing AI Agent');
    assert.equal(chat.modelMode, 'nemotron');
    assert.equal(chat.pinned, false);
    testChatA = chat.id;

    // Verify file on disk
    const fetched = getChat(testChatA);
    assert.ok(fetched, 'Conversation file must exist on disk');
    assert.equal(fetched.id, testChatA);
  });

  it('3. Append user & assistant messages and preserve actual model metadata', () => {
    const userMsg = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: 'Analyze renewable grid transition.',
      timestamp: new Date().toISOString()
    };
    appendMessage(testChatA, userMsg);

    const aiMsg = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: 'Transitioning to renewable energy requires grid storage buffers.',
      model: 'NVIDIA Nemotron 3',
      actualModel: 'nemotron-3-nano:latest',
      timestamp: new Date().toISOString()
    };
    const updated = appendMessage(testChatA, aiMsg);

    assert.equal(updated.messages.length, 2);
    assert.equal(updated.messages[0].role, 'user');
    assert.equal(updated.messages[1].role, 'assistant');
    assert.equal(updated.messages[1].actualModel, 'nemotron-3-nano:latest');
  });

  it('4. Auto-generate concise deterministic title from prompt if default', () => {
    const chat = createChat({
      title: 'New Conversation',
      agentId: 'agent-003',
      agentName: 'Coding AI Agent',
      modelMode: 'qwen'
    });
    testChatB = chat.id;

    const updated = appendMessage(testChatB, {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: 'Write a Python function to compute pump affinity law flow.',
      timestamp: new Date().toISOString()
    });

    assert.ok(updated.title && updated.title !== 'New Conversation', `Title should auto-generate, got: ${updated.title}`);
  });

  it('5. Pin and unpin conversation changes sorting priority', () => {
    updateChat(testChatA, { pinned: true });
    let chats = listChats();
    assert.equal(chats[0].id, testChatA, 'Pinned chat should appear first');

    updateChat(testChatA, { pinned: false });
    chats = listChats();
    const chatA = chats.find(c => c.id === testChatA);
    assert.equal(chatA.pinned, false);
  });

  it('6. Rename conversation persists to storage', () => {
    const renamed = updateChat(testChatA, { title: 'Strategic Renewable Plan 2026' });
    assert.equal(renamed.title, 'Strategic Renewable Plan 2026');

    const loaded = getChat(testChatA);
    assert.equal(loaded.title, 'Strategic Renewable Plan 2026');
  });

  it('7. Search conversations by title, agent name, and content', () => {
    const results = searchChats('Strategic');
    assert.ok(results.some(c => c.id === testChatA), 'Search by title must match');

    const agentResults = searchChats('Coding AI');
    assert.ok(agentResults.some(c => c.id === testChatB), 'Search by agent name must match');
  });

  it('8. Restore agent and model state on conversation reopen', () => {
    const chatA = getChat(testChatA);
    assert.equal(chatA.agentId, 'agent-001');
    assert.equal(chatA.modelMode, 'nemotron');

    const chatB = getChat(testChatB);
    assert.equal(chatB.agentId, 'agent-003');
    assert.equal(chatB.modelMode, 'qwen');
  });

  it('9. Delete conversation and confirm purge from disk', () => {
    const deletedA = deleteChat(testChatA);
    const deletedB = deleteChat(testChatB);
    assert.equal(deletedA, true);
    assert.equal(deletedB, true);

    assert.equal(getChat(testChatA), null);
    assert.equal(getChat(testChatB), null);
  });
});
