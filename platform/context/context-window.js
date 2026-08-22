/**
 * Sovereign AI Workbench — Context Window & Token Budget Manager
 * Safely bounds multi-turn context within local model token limits without truncating active queries.
 */

import { ContextPolicy } from './context-policy.js';

export class ContextWindowManager {
  /**
   * Estimates token count for a text string (~1.33 words per token heuristic).
   */
  estimateTokens(text) {
    if (!text || typeof text !== 'string') return 0;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words * 1.33));
  }

  /**
   * Assembles a bounded list of recent and relevant turns fitting within the token budget.
   */
  fitContext({ systemPrompt, summary, relevantTurns = [], recentTurns = [], currentPrompt }) {
    const maxTokens = ContextPolicy.MAX_CONTEXT_TOKENS;
    const sysTokens = this.estimateTokens(systemPrompt);
    const queryTokens = this.estimateTokens(currentPrompt);
    const summaryTokens = this.estimateTokens(summary);

    let remainingBudget = maxTokens - (sysTokens + queryTokens + summaryTokens);

    const includedRecent = [];
    // Process recent turns from newest to oldest
    for (const turn of [...recentTurns].reverse()) {
      const turnTokens = this.estimateTokens(turn.content);
      if (remainingBudget - turnTokens >= 0) {
        includedRecent.unshift(turn);
        remainingBudget -= turnTokens;
      } else {
        break;
      }
    }

    const includedRelevant = [];
    for (const turn of relevantTurns) {
      if (includedRecent.some(r => r.id === turn.id)) continue;
      const turnTokens = this.estimateTokens(turn.content);
      if (remainingBudget - turnTokens >= 0) {
        includedRelevant.push(turn);
        remainingBudget -= turnTokens;
      }
    }

    return {
      systemPrompt,
      summary,
      includedRelevant,
      includedRecent,
      currentPrompt,
      estimatedTotalTokens: maxTokens - remainingBudget
    };
  }
}

export const contextWindowManager = new ContextWindowManager();
