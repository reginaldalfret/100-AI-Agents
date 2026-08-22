/**
 * Sovereign AI Workbench — Authoritative Conversation Storage & Persistence Service
 * Authoritative Storage: E:\Smart Automation\100-AI-Agents\data\conversations
 * Ensures real conversation history survives browser refresh and gateway restart.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.env.PROJECT_ROOT || 'E:\\Smart Automation\\100-AI-Agents';
const CONVERSATIONS_DIR = path.join(ROOT, 'data', 'conversations');
const CONTEXT_DIR = path.join(ROOT, 'data', 'context');

// Ensure conversations directory exists
if (!fs.existsSync(CONVERSATIONS_DIR)) {
  fs.mkdirSync(CONVERSATIONS_DIR, { recursive: true });
}

function getFilePath(id) {
  const safeId = String(id).replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(CONVERSATIONS_DIR, `${safeId}.json`);
}

export function generateDeterministicTitle(firstPrompt) {
  if (!firstPrompt || typeof firstPrompt !== 'string') return 'New Conversation';
  const clean = firstPrompt.trim().replace(/\s+/g, ' ');

  const lower = clean.toLowerCase();

  if (lower.includes('renewable energy')) return 'Renewable Energy Article';
  if (lower.includes('hx-204') || lower.includes('heat exchanger')) return 'HX-204 Ultrasonic Thickness Analysis';
  if (lower.includes('compare gemini') || lower.includes('gemini models')) return 'Compare Gemini Models';
  if (lower.includes('explain') && (lower.includes('slide') || lower.includes('diagram'))) return 'Explain Technical Diagram';
  if (lower.includes('full-stack') || lower.includes('website')) return 'Full-Stack Website Project';
  if (lower.includes('corrosion') || lower.includes('thickness')) return 'Corrosion & Remaining Life Analysis';
  if (lower.includes('p&id') || lower.includes('valve')) return 'P&ID Schematic Inspection';

  // Smart prefix removal
  let subject = clean
    .replace(/^(please\s+|can\s+you\s+|i\s+want\s+you\s+to\s+|write\s+a\s+|draft\s+a\s+|explain\s+|analyze\s+|investigate\s+|create\s+|build\s+)/i, '')
    .trim();

  if (!subject) subject = clean;

  // Capitalize words
  const words = subject.split(' ').slice(0, 5);
  return words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Migration Adapter: Scans legacy data/context/CONV-*.json and imports real conversations.
 */
function migrateLegacyConversations() {
  try {
    if (!fs.existsSync(CONTEXT_DIR)) return;
    const contextFiles = fs.readdirSync(CONTEXT_DIR).filter(f => f.startsWith('CONV-') && f.endsWith('.json'));

    for (const cf of contextFiles) {
      try {
        const cPath = path.join(CONTEXT_DIR, cf);
        const raw = fs.readFileSync(cPath, 'utf8');
        const data = JSON.parse(raw);

        if (Array.isArray(data.messages) && data.messages.length > 0) {
          const targetId = `chat-${data.conversation_id || cf.replace('.json', '')}`;
          const targetPath = getFilePath(targetId);

          if (!fs.existsSync(targetPath)) {
            const firstUserMsg = data.messages.find(m => m.role === 'user');
            const title = firstUserMsg ? generateDeterministicTitle(firstUserMsg.content) : 'Industrial Investigation';

            const newChat = {
              id: targetId,
              title,
              agentId: 'agent-101',
              agentName: 'Super AI Agent',
              modelMode: 'auto',
              pinned: false,
              createdAt: data.created_at || new Date().toISOString(),
              updatedAt: data.updated_at || new Date().toISOString(),
              messages: data.messages.map(m => ({
                id: m.id || `msg-${Date.now()}`,
                role: m.role || 'user',
                content: m.content || '',
                model: m.model_name || 'NVIDIA Nemotron 3',
                actualModel: m.model_name ? 'gemma3:4b' : 'nemotron-3-nano:latest',
                timestamp: m.timestamp || new Date().toISOString()
              }))
            };

            fs.writeFileSync(targetPath, JSON.stringify(newChat, null, 2), 'utf8');
          }
        }
      } catch (err) {
        // Skip unreadable files
      }
    }
  } catch (err) {
    console.warn('Legacy context migration warning:', err.message);
  }
}

// Perform one-time legacy migration check
migrateLegacyConversations();

/**
 * Purge empty 0-message temporary chats so the sidebar only displays real conversations.
 */
export function purgeEmptyPlaceholderChats() {
  try {
    const files = fs.readdirSync(CONVERSATIONS_DIR).filter(f => f.endsWith('.json'));
    for (const f of files) {
      const p = path.join(CONVERSATIONS_DIR, f);
      try {
        const raw = fs.readFileSync(p, 'utf8');
        const data = JSON.parse(raw);
        if (data.title === 'New Chat' && (!Array.isArray(data.messages) || data.messages.length === 0)) {
          fs.unlinkSync(p);
        }
      } catch {
        // Ignored
      }
    }
  } catch {
    // Ignored
  }
}

export function listChats() {
  try {
    purgeEmptyPlaceholderChats();

    const files = fs.readdirSync(CONVERSATIONS_DIR).filter(f => f.endsWith('.json'));
    const chats = [];

    for (const file of files) {
      try {
        const filePath = path.join(CONVERSATIONS_DIR, file);
        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);

        // Skip 0-message "New Chat" records
        if (data.title === 'New Chat' && (!Array.isArray(data.messages) || data.messages.length === 0)) {
          continue;
        }

        const messages = Array.isArray(data.messages) ? data.messages : [];
        const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;

        chats.push({
          id: data.id || file.replace('.json', ''),
          title: data.title || 'Conversation',
          agentId: data.agentId || 'agent-101',
          agentName: data.agentName || 'Super AI Agent',
          modelMode: data.modelMode || 'auto',
          pinned: Boolean(data.pinned),
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          messageCount: messages.length,
          preview: lastMsg ? (typeof lastMsg.content === 'string' ? lastMsg.content.slice(0, 80) : '') : ''
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
    title: data.title || 'New Conversation',
    agentId: data.agentId || 'agent-101',
    agentName: data.agentName || 'Super AI Agent',
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

  // Auto-generate title on first user message if default
  if ((chat.title === 'New Chat' || chat.title === 'New Conversation') && message.role === 'user' && message.content) {
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
    return (c.title && c.title.toLowerCase().includes(q)) ||
           (c.agentName && c.agentName.toLowerCase().includes(q)) ||
           (c.preview && c.preview.toLowerCase().includes(q)) ||
           (c.modelMode && c.modelMode.toLowerCase().includes(q));
  });
}
