/**
 * Sovereign AI Workbench — Contextual Relevance Retriever
 * Retrieves high-relevance prior turns from older conversation history based on semantic & entity overlap.
 */

import { ContextPolicy } from './context-policy.js';

export class RelevanceRetriever {
  /**
   * Retrieves top relevant older messages matching the current query context.
   */
  retrieveRelevantTurns(currentPrompt, allMessages = [], activeEntities = [], topicState = {}) {
    if (!currentPrompt || !Array.isArray(allMessages) || allMessages.length <= ContextPolicy.RECENT_TURNS) {
      return [];
    }

    const olderTurns = allMessages.slice(0, -ContextPolicy.RECENT_TURNS);
    const cleanPrompt = currentPrompt.toLowerCase();
    const promptTokens = new Set(cleanPrompt.split(/\W+/).filter(t => t.length > 2));
    const entityNames = new Set(activeEntities.map(e => (e.name || e.id).toLowerCase()));

    const scored = olderTurns.map((msg, idx) => {
      const content = (msg.content || '').toLowerCase();
      const msgTokens = new Set(content.split(/\W+/).filter(t => t.length > 2));

      let score = 0;

      // 1. Keyword overlap
      for (const t of promptTokens) {
        if (msgTokens.has(t)) score += 1.5;
      }

      // 2. Entity overlap
      for (const ent of entityNames) {
        if (content.includes(ent)) score += 3.0;
      }

      // 3. Topic match
      if (topicState.activeTopic && content.includes(topicState.activeTopic.toLowerCase())) {
        score += 2.0;
      }

      // 4. Code block bonus if user asks about code
      if ((cleanPrompt.includes('code') || cleanPrompt.includes('function')) && content.includes('```')) {
        score += 4.0;
      }

      return { message: msg, score, index: idx };
    });

    return scored
      .filter(item => item.score >= 2.0)
      .sort((a, b) => b.score - a.score)
      .slice(0, ContextPolicy.MAX_RELEVANT_MESSAGES)
      .map(item => item.message);
  }
}

export const relevanceRetriever = new RelevanceRetriever();
