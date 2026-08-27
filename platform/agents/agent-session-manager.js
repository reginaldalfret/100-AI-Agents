/**
 * Agent Session Manager Module
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');
const SESSIONS_DIR = path.join(ROOT_DIR, 'runtime', 'sessions', 'agents');

export class AgentSessionManager {
  constructor() {
    this.sessions = new Map();
    if (!fs.existsSync(SESSIONS_DIR)) {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    }
  }

  createSession(agentId, options = {}) {
    const sessionId = crypto.randomUUID();
    const session = {
      agentId,
      turns: [],
      createdAt: new Date().toISOString(),
      ...options
    };
    this.sessions.set(sessionId, session);
    this._saveSession(sessionId);
    return sessionId;
  }

  sendMessage(sessionId, message) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);
    
    session.turns.push({ role: 'user', content: message, timestamp: new Date().toISOString() });
    this._saveSession(sessionId);
    
    // In a real implementation, this would interact with the AgentLauncher to send to stdin
    return true;
  }

  getSessionHistory(sessionId) {
    const session = this.sessions.get(sessionId);
    return session ? session.turns : null;
  }

  closeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    session.closedAt = new Date().toISOString();
    this._saveSession(sessionId);
    this.sessions.delete(sessionId);
    return true;
  }

  listSessions(agentId) {
    const list = [];
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.agentId === agentId) {
        list.push({ sessionId, ...session });
      }
    }
    return list;
  }

  _saveSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    const sessionFile = path.join(SESSIONS_DIR, `${sessionId}.json`);
    fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2), 'utf8');
  }
}

export const sessionManager = new AgentSessionManager();
