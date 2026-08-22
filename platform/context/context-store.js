/**
 * Sovereign AI Workbench — Canonical Persistent Context Store
 * Enforces unified context hierarchy across Conversations, Investigations, Plans, Steps, and Evidence.
 */

import fs from "node:fs";
import path from "node:path";
import { entityMemory } from "./entity-memory.js";

export const RetentionPolicy = {
  EPHEMERAL: "ephemeral",
  SESSION: "session",
  TASK: "task",
  LONG_TERM: "long_term"
};

class ContextStore {
  constructor(storageDir) {
    this.storageDir = storageDir || "E:\\Smart Automation\\100-AI-Agents\\data\\context";
    this.sessions = new Map(); // conversation_id -> session_context
    this.activeConversationId = null;

    this._initStorage();
  }

  _initStorage() {
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }
    } catch {
      // Memory fallback if filesystem restricted
    }
  }

  createSession(options = {}) {
    const convId = options.conversation_id || `CONV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const session = {
      conversation_id: convId,
      user_id: options.user_id || "engineer-01",
      role: options.role || "Engineer",
      active_entity_id: options.active_entity_id || null,
      active_investigation_id: null,
      messages: [],
      uploaded_files: [],
      evidence_references: [],
      task_history: [],
      state: {},
      retention: options.retention || RetentionPolicy.SESSION,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.sessions.set(convId, session);
    this.activeConversationId = convId;
    this._persistSession(session);
    return session;
  }

  getSession(convId) {
    const id = convId || this.activeConversationId;
    if (!id) return this.createSession();
    let session = this.sessions.get(id);
    if (!session) {
      session = this._loadSession(id) || this.createSession({ conversation_id: id });
    }
    return session;
  }

  appendMessage(convId, message) {
    const session = this.getSession(convId);
    session.messages.push({
      id: `MSG-${Date.now()}`,
      role: message.role || "user",
      content: message.content || message.text || "",
      model_name: message.model_name || null,
      evidence_refs: message.evidence_refs || [],
      timestamp: new Date().toISOString()
    });

    // Auto-detect entity mentions
    const text = (message.content || "").toUpperCase();
    const entityMatch = text.match(/\b(HX-\d+|TK-\d+|P-\d+|V-\d+|C-\d+|DWG-\d+)\b/);
    if (entityMatch) {
      session.active_entity_id = entityMatch[1];
      entityMemory.registerEntity({
        id: entityMatch[1],
        type: entityMatch[1].startsWith("HX") ? "heat_exchanger" : "equipment",
        last_mentioned_in: session.conversation_id
      });
    }

    session.updated_at = new Date().toISOString();
    this._persistSession(session);
    return session;
  }

  setActiveEntity(convId, entityId) {
    const session = this.getSession(convId);
    session.active_entity_id = entityId;
    session.updated_at = new Date().toISOString();
    this._persistSession(session);
    return session;
  }

  clearSession(convId) {
    const id = convId || this.activeConversationId;
    if (id && this.sessions.has(id)) {
      this.sessions.delete(id);
      const filePath = path.join(this.storageDir, `${id}.json`);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch {}
      }
    }
    return { cleared: true, conversation_id: id };
  }

  _persistSession(session) {
    try {
      const filePath = path.join(this.storageDir, `${session.conversation_id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(session, null, 2), "utf8");
    } catch {}
  }

  _loadSession(convId) {
    try {
      const filePath = path.join(this.storageDir, `${convId}.json`);
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf8");
        const session = JSON.parse(raw);
        this.sessions.set(convId, session);
        return session;
      }
    } catch {}
    return null;
  }
}

export const contextStore = new ContextStore();
