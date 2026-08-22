/**
 * Sovereign AI Workbench — Incremental Conversation Summarizer
 * Maintains dense, structured summaries for conversations exceeding the recent window threshold.
 */

import { ContextPolicy } from './context-policy.js';

export class ConversationSummarizer {
  constructor() {
    this.sessionSummaries = new Map(); // conversation_id -> string
  }

  getSummary(conversationId) {
    if (!conversationId) return '';
    return this.sessionSummaries.get(conversationId) || '';
  }

  /**
   * Incrementally updates conversation summary when threshold is reached.
   */
  updateSummary(conversationId, messages = [], topicState = {}, entities = []) {
    if (!conversationId || !Array.isArray(messages) || messages.length < ContextPolicy.SUMMARY_THRESHOLD) {
      return this.getSummary(conversationId);
    }

    // Build dense extractive summary from older turns
    const olderTurns = messages.slice(0, -ContextPolicy.RECENT_TURNS);
    if (olderTurns.length === 0) return this.getSummary(conversationId);

    const userRequests = olderTurns
      .filter(m => m.role === 'user' && m.content)
      .map(m => m.content.trim().slice(0, 100));

    const topic = topicState.activeTopic || 'general task';
    const subtopic = topicState.subtopic ? ` > ${topicState.subtopic}` : '';
    const keyEntities = entities.slice(0, 8).map(e => e.name || e.id).join(', ');

    const summaryParts = [
      `Active Context: ${topic}${subtopic}.`,
      userRequests.length > 0 ? `Prior Requests: ${userRequests.join('; ')}.` : '',
      keyEntities ? `Key Entities: ${keyEntities}.` : ''
    ].filter(Boolean);

    const summary = summaryParts.join(' ');
    this.sessionSummaries.set(conversationId, summary);
    return summary;
  }

  clearSession(conversationId) {
    this.sessionSummaries.delete(conversationId);
  }

  serialize(conversationId) {
    return this.getSummary(conversationId);
  }

  hydrate(conversationId, summaryText = '') {
    if (summaryText) {
      this.sessionSummaries.set(conversationId, summaryText);
    }
  }
}

export const conversationSummarizer = new ConversationSummarizer();
