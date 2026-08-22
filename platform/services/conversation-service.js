import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.env.PROJECT_ROOT || 'E:\\Smart Automation\\100-AI-Agents';
const CONVERSATIONS_DIR = path.join(ROOT, 'data', 'conversations');

// Ensure conversations directory exists
if (!fs.existsSync(CONVERSATIONS_DIR)) {
  fs.mkdirSync(CONVERSATIONS_DIR, { recursive: true });
}

function getFilePath(id) {
  const safeId = String(id).replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(CONVERSATIONS_DIR, `${safeId}.json`);
}

function generateDeterministicTitle(firstPrompt) {
  if (!firstPrompt || typeof firstPrompt !== 'string') return 'New Chat';
  const clean = firstPrompt.trim().replace(/\s+/g, ' ');
  
  // Quick patterns
  const lower = clean.toLowerCase();
  if (lower.startsWith('compare ')) {
    return clean.slice(0, 36).trim();
  }
  if (lower.startsWith('analyze ') || lower.startsWith('investigate ')) {
    return clean.slice(0, 36).trim();
  }
  if (lower.startsWith('write ') || lower.startsWith('draft ')) {
    return clean.slice(0, 36).trim();
  }
  if (lower.startsWith('explain ') || lower.startsWith('how to ')) {
    return clean.slice(0, 36).trim();
  }
  
  // Truncate to first 5-7 words
  const words = clean.split(' ');
  if (words.length <= 6) return clean;
  return words.slice(0, 6).join(' ');
}

export function listChats() {
  try {
    const files = fs.readdirSync(CONVERSATIONS_DIR).filter(f => f.endsWith('.json'));
    const chats = [];

    for (const file of files) {
      try {
        const filePath = path.join(CONVERSATIONS_DIR, file);
        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);
        chats.push({
          id: data.id || file.replace('.json', ''),
          title: data.title || 'New Chat',
          agentId: data.agentId || 'agent-101',
          agentName: data.agentName || 'Super AI',
          modelMode: data.modelMode || 'auto',
          pinned: Boolean(data.pinned),
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          messageCount: Array.isArray(data.messages) ? data.messages.length : 0,
          preview: Array.isArray(data.messages) && data.messages.length > 0
            ? (data.messages[data.messages.length - 1].content || '').slice(0, 60)
            : ''
        });
      } catch (err) {
        console.warn(`Error reading conversation file ${file}:`, err.message);
      }
    }

    // Sort: Pinned first, then by updatedAt descending
    chats.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return chats;
  } catch (err) {
    console.error('Failed to list chats:', err);
    return [];
  }
}

export function getChat(id) {
  try {
    const filePath = getFilePath(id);
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to get chat ${id}:`, err);
    return null;
  }
}

export function createChat(data = {}) {
  const id = data.id || `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  
  const chat = {
    id,
    title: data.title || 'New Chat',
    agentId: data.agentId || 'agent-101',
    agentName: data.agentName || 'Super AI',
    modelMode: data.modelMode || 'auto',
    pinned: Boolean(data.pinned),
    createdAt: data.createdAt || now,
    updatedAt: now,
    messages: Array.isArray(data.messages) ? data.messages : []
  };

  const filePath = getFilePath(id);
  fs.writeFileSync(filePath, JSON.stringify(chat, null, 2), 'utf8');
  return chat;
}

export function updateChat(id, updates = {}) {
  const chat = getChat(id);
  if (!chat) return null;

  if (typeof updates.title === 'string' && updates.title.trim()) {
    chat.title = updates.title.trim();
  }
  if (typeof updates.pinned === 'boolean') {
    chat.pinned = updates.pinned;
  }
  if (typeof updates.agentId === 'string') {
    chat.agentId = updates.agentId;
  }
  if (typeof updates.agentName === 'string') {
    chat.agentName = updates.agentName;
  }
  if (typeof updates.modelMode === 'string') {
    chat.modelMode = updates.modelMode;
  }
  if (Array.isArray(updates.messages)) {
    chat.messages = updates.messages;
  }

  chat.updatedAt = new Date().toISOString();

  const filePath = getFilePath(id);
  fs.writeFileSync(filePath, JSON.stringify(chat, null, 2), 'utf8');
  return chat;
}

export function appendMessage(id, message) {
  let chat = getChat(id);
  if (!chat) {
    chat = createChat({ id });
  }

  if (!Array.isArray(chat.messages)) {
    chat.messages = [];
  }

  chat.messages.push(message);
  chat.updatedAt = new Date().toISOString();

  // Auto-generate title on first user message if still "New Chat"
  if (chat.title === 'New Chat' && message.role === 'user' && message.content) {
    chat.title = generateDeterministicTitle(message.content);
  }

  const filePath = getFilePath(id);
  fs.writeFileSync(filePath, JSON.stringify(chat, null, 2), 'utf8');
  return chat;
}

export function deleteChat(id) {
  try {
    const filePath = getFilePath(id);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`Failed to delete chat ${id}:`, err);
    return false;
  }
}

export function searchChats(query) {
  const allChats = listChats();
  if (!query || typeof query !== 'string') return allChats;
  
  const q = query.toLowerCase().trim();
  return allChats.filter(c => {
    return c.title.toLowerCase().includes(q) ||
           c.agentName.toLowerCase().includes(q) ||
           (c.preview && c.preview.toLowerCase().includes(q));
  });
}
