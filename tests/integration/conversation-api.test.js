/**
 * Integration Test Suite: Authoritative Conversation API & Persistence
 * Tests: List, Create, Read, Update, Append Message, Search, Pin, Rename, Delete
 * Storage: E:\Smart Automation\100-AI-Agents\data\conversations
 */

import assert from 'node:assert';
import http from 'node:http';

const GATEWAY_URL = 'http://127.0.0.1:8300';

function request(path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = `${GATEWAY_URL}${path}`;
    const headers = { ...(options.headers || {}) };
    let payload = null;

    if (body) {
      payload = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(url, { ...options, headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

let passed = 0;
let failed = 0;

function pass(name) {
  console.log(`  [PASS] ${name}`);
  passed++;
}

function fail(name, err) {
  console.error(`  [FAIL] ${name}`);
  if (err) console.error(`         ${err.message}`);
  failed++;
}

async function runTests() {
  console.log('============================================================');
  console.log('RUNNING TEST SUITE: Conversation API & Persistence');
  console.log('============================================================');

  let testChatId = null;

  // Test 1: List existing conversations
  try {
    const res = await request('/api/chats');
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.data.chats), 'Response must contain chats array');
    assert(res.data.chats.length > 0, 'Must load real persisted conversations');
    assert(res.data.chats.every(c => c.title !== 'New Chat' || c.messageCount > 0), 'No empty New Chat placeholders');
    pass(`GET /api/chats returns ${res.data.chats.length} real persisted conversations`);
  } catch (e) {
    fail('GET /api/chats returns real persisted conversations', e);
  }

  // Test 2: Create a real conversation
  try {
    const res = await request('/api/chats', { method: 'POST' }, {
      title: 'Renewable Energy Strategy',
      agentId: 'agent-001',
      agentName: 'Writing AI Agent',
      modelMode: 'nemotron',
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: 'user',
          content: 'Write an executive brief on renewable energy strategy.',
          timestamp: new Date().toISOString()
        }
      ]
    });
    assert.strictEqual(res.status, 201);
    assert(res.data.chat?.id, 'Created chat must have an ID');
    assert.strictEqual(res.data.chat.title, 'Renewable Energy Strategy');
    assert.strictEqual(res.data.chat.agentId, 'agent-001');
    assert.strictEqual(res.data.chat.modelMode, 'nemotron');
    testChatId = res.data.chat.id;
    pass(`POST /api/chats creates and persists conversation (ID: ${testChatId})`);
  } catch (e) {
    fail('POST /api/chats creates and persists conversation', e);
  }

  // Test 3: Get conversation by ID
  try {
    const res = await request(`/api/chats/${testChatId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.chat.id, testChatId);
    assert.strictEqual(res.data.chat.messages.length, 1);
    pass(`GET /api/chats/${testChatId} retrieves conversation and full message history`);
  } catch (e) {
    fail(`GET /api/chats/:id retrieves conversation`, e);
  }

  // Test 4: Append message & auto-generate title if default
  try {
    const res = await request(`/api/chats/${testChatId}/messages`, { method: 'POST' }, {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: 'Here is the executive summary on solar and wind grid integration.',
      model: 'NVIDIA Nemotron 3',
      actualModel: 'nemotron-3-nano:latest',
      timestamp: new Date().toISOString()
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.chat.messages.length, 2);
    pass(`POST /api/chats/${testChatId}/messages appends response message`);
  } catch (e) {
    fail(`POST /api/chats/:id/messages appends message`, e);
  }

  // Test 5: Search conversations
  try {
    const res = await request('/api/chats?q=Renewable');
    assert.strictEqual(res.status, 200);
    assert(res.data.chats.length >= 1, 'Search query "Renewable" must match created conversation');
    assert(res.data.chats.some(c => c.id === testChatId));
    pass('GET /api/chats?q=query searches titles, agent names, and message previews');
  } catch (e) {
    fail('GET /api/chats?q=query searches conversations', e);
  }

  // Test 6: Pin & Rename via PATCH
  try {
    const res = await request(`/api/chats/${testChatId}`, { method: 'PATCH' }, {
      pinned: true,
      title: 'Pinned Renewable Energy Dossier'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.chat.pinned, true);
    assert.strictEqual(res.data.chat.title, 'Pinned Renewable Energy Dossier');
    pass('PATCH /api/chats/:id updates pin status and title');
  } catch (e) {
    fail('PATCH /api/chats/:id updates pin status and title', e);
  }

  // Test 7: Delete conversation
  try {
    const res = await request(`/api/chats/${testChatId}`, { method: 'DELETE' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.deleted, true);

    const checkRes = await request(`/api/chats/${testChatId}`);
    assert.strictEqual(checkRes.status, 404, 'Deleted conversation must return 404');
    pass('DELETE /api/chats/:id permanently deletes conversation record');
  } catch (e) {
    fail('DELETE /api/chats/:id permanently deletes conversation record', e);
  }

  console.log('------------------------------------------------------------');
  console.log(`Summary: ${passed} Passed, ${failed} Failed`);
  console.log('============================================================');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Fatal API test error:', err);
  process.exit(1);
});
