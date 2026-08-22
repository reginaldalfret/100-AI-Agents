/**
 * Sovereign AI Workbench — Canonical Conversational Memory & Context Manager
 * Coordinates context resolution, prompt building, turn recording, and memory lifecycle per session.
 */

import fs from 'node:fs';
import path from 'node:path';
import { contextResolver } from './context-resolver.js';
import { contextBuilder } from './context-builder.js';
import { entityMemory } from './entity-memory.js';
import { topicMemory } from './topic-memory.js';
import { conversationSummarizer } from './conversation-summarizer.js';

const ROOT = process.env.PROJECT_ROOT || 'E:\\Smart Automation\\100-AI-Agents';
const CONVERSATIONS_DIR = path.join(ROOT, 'data', 'conversations');

export class ConversationManager {
  constructor() {
    this.activeConversationId = null;
    this.sessionCache = new Map(); // conversationId -> { messages: [], memory: {} }
    this._ensureStorage();
  }

  _ensureStorage() {
    try {
      if (!fs.existsSync(CONVERSATIONS_DIR)) {
        fs.mkdirSync(CONVERSATIONS_DIR, { recursive: true });
      }
    } catch {
      // Memory fallback
    }
  }

  /**
   * Loads or creates a conversation session from disk/cache.
   */
  getConversation(conversationId) {
    if (!conversationId) return null;
    const cleanId = String(conversationId).replace(/[^a-zA-Z0-9_-]/g, '');

    if (this.sessionCache.has(cleanId)) {
      return this.sessionCache.get(cleanId);
    }

    const filePath = path.join(CONVERSATIONS_DIR, `${cleanId}.json`);
    let convData = null;

    if (fs.existsSync(filePath)) {
      try {
        convData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (err) {
        console.warn(`Failed to read conversation file ${filePath}:`, err.message);
      }
    }

    if (!convData) {
      convData = {
        id: cleanId,
        title: 'New Conversation',
        agentId: 'agent-101',
        modelMode: 'auto',
        messages: [],
        memory: {
          summary: '',
          activeTopic: '',
          subtopic: '',
          entities: []
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    // Hydrate memory engines
    if (convData.memory) {
      if (convData.memory.entities) entityMemory.hydrate(cleanId, convData.memory.entities);
      if (convData.memory.activeTopic || convData.memory.subtopic) {
        topicMemory.hydrate(cleanId, {
          activeTopic: convData.memory.activeTopic,
          subtopic: convData.memory.subtopic
        });
      }
      if (convData.memory.summary) conversationSummarizer.hydrate(cleanId, convData.memory.summary);
    }

    // If memory is empty but messages exist, backfill entity and topic extraction
    if (Array.isArray(convData.messages) && convData.messages.length > 0 && !convData.memory?.activeTopic) {
      for (const msg of convData.messages) {
        if (msg.role === 'user') {
          topicMemory.updateTopic(cleanId, msg.content);
        }
        entityMemory.extractEntitiesFromText(cleanId, msg.content, msg.role);
      }
    }

    this.sessionCache.set(cleanId, convData);
    this.activeConversationId = cleanId;
    return convData;
  }

  /**
   * Prepares the full context-enriched payload for an incoming prompt before model execution.
   */
  prepareContext({ conversationId, agent, task, model = '', images = [], replyTo = null }) {
    const conv = this.getConversation(conversationId);
    const messages = conv ? (conv.messages || []) : [];

    // 1. Resolve references, topics, and relevant prior context
    const resolvedContext = contextResolver.resolve({
      conversationId,
      messageText: task,
      allMessages: messages,
      replyTo
    });

    // 2. Build model-ready payload
    const payload = contextBuilder.buildModelPayload({
      agent,
      resolvedContext,
      userPrompt: task,
      model,
      images
    });

    return {
      ...payload,
      resolvedContext,
      conversationId: conv?.id || conversationId
    };
  }

  /**
   * Records a completed turn into memory and persists conversation state safely to disk.
   */
  recordTurn({ conversationId, userPrompt, assistantResponse, agent, model = '', replyTo = null }) {
    if (!conversationId) return;
    const cleanId = String(conversationId).replace(/[^a-zA-Z0-9_-]/g, '');
    const conv = this.getConversation(cleanId);
    if (!conv) return;

    // 1. Extract entities from user prompt and assistant response
    entityMemory.extractEntitiesFromText(cleanId, userPrompt, 'user');
    entityMemory.extractEntitiesFromText(cleanId, assistantResponse, 'assistant');

    // 2. Update topic memory
    topicMemory.updateTopic(cleanId, userPrompt, assistantResponse);

    // 3. Update summary if threshold met
    const topicState = topicMemory.getTopicState(cleanId);
    const entities = entityMemory.getEntities(cleanId);
    conversationSummarizer.updateSummary(cleanId, conv.messages, topicState, entities);

    // 4. Update conversation memory snapshot
    conv.memory = {
      summary: conversationSummarizer.getSummary(cleanId),
      activeTopic: topicState.activeTopic,
      subtopic: topicState.subtopic,
      intent: topicState.intent,
      entities: entityMemory.serialize(cleanId)
    };

    conv.updatedAt = new Date().toISOString();

    // 5. Persist to disk
    this._persistConversation(conv);
    return conv;
  }

  /**
   * Appends a message to conversation history and memory.
   */
  appendMessage(conversationId, message) {
    const conv = this.getConversation(conversationId);
    if (!conv) return null;

    if (!Array.isArray(conv.messages)) conv.messages = [];
    conv.messages.push({
      id: message.id || `msg-${Date.now()}`,
      role: message.role || 'user',
      content: message.content || '',
      model: message.model || null,
      actualModel: message.actualModel || null,
      timestamp: message.timestamp || new Date().toISOString()
    });

    // Update memory
    if (message.content) {
      entityMemory.extractEntitiesFromText(conv.id, message.content, message.role);
      if (message.role === 'user') {
        topicMemory.updateTopic(conv.id, message.content);
      }
    }

    conv.updatedAt = new Date().toISOString();
    this._persistConversation(conv);
    return conv;
  }

  _persistConversation(conv) {
    if (!conv || !conv.id) return;
    try {
      const filePath = path.join(CONVERSATIONS_DIR, `${conv.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(conv, null, 2), 'utf8');
    } catch (err) {
      console.warn(`Failed to persist conversation ${conv.id}:`, err.message);
    }
  }

  /**
   * Resets active memory when switching to a New Chat.
   */
  resetActiveContext(newConversationId = null) {
    if (this.activeConversationId) {
      // Clear memory caches if needed
    }
    this.activeConversationId = newConversationId;
  }
}

export const conversationManager = new ConversationManager();
