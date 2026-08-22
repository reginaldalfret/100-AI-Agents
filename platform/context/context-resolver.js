/**
 * Sovereign AI Workbench — Main Context & Reference Resolver Coordinator
 * Answers: "What previous information and entities are required to understand this message?"
 */

import { referenceResolver } from './reference-resolver.js';
import { entityMemory } from './entity-memory.js';
import { topicMemory } from './topic-memory.js';
import { conversationSummarizer } from './conversation-summarizer.js';
import { relevanceRetriever } from './relevance-retriever.js';
import { ContextPolicy } from './context-policy.js';

export class ContextResolver {
  /**
   * Resolves the full context for an incoming user message within a conversation.
   */
  resolve({ conversationId, messageText, allMessages = [], replyTo = null }) {
    const rawText = (messageText || '').trim();
    if (!conversationId) {
      return {
        resolvedReferences: [],
        activeTopic: '',
        subtopic: '',
        summary: '',
        entities: [],
        recentMessages: [],
        relevantMessages: [],
        resolvedPrompt: rawText,
        confidence: 1.0,
        clarificationNeeded: false
      };
    }

    // 1. Retrieve Current Session Memory State
    const topicState = topicMemory.getTopicState(conversationId);
    const entities = entityMemory.getEntities(conversationId);
    const summary = conversationSummarizer.getSummary(conversationId);

    // 2. Extract Recent Turns Window
    const recentMessages = allMessages.slice(-ContextPolicy.RECENT_TURNS);

    // 3. Resolve Coreferences & Anaphora
    const refResult = referenceResolver.resolveReferences(rawText, {
      recentMessages,
      activeTopic: topicState.activeTopic,
      subtopic: topicState.subtopic,
      entities,
      replyTo
    });

    // 4. Update Topic Memory tentatively with user query
    topicMemory.updateTopic(conversationId, rawText);
    const updatedTopic = topicMemory.getTopicState(conversationId);

    // 5. Retrieve Non-Recent Relevant Turns if conversation is long
    const relevantMessages = relevanceRetriever.retrieveRelevantTurns(
      rawText,
      allMessages,
      entities,
      updatedTopic
    );

    // 6. Check Ambiguity / Confidence Threshold
    let clarificationNeeded = false;
    let clarificationPrompt = null;
    if (refResult.ambiguity) {
      clarificationNeeded = true;
      clarificationPrompt = `Did you mean ${refResult.ambiguity.candidateA} or ${refResult.ambiguity.candidateB}?`;
    }

    return {
      resolvedReferences: refResult.references,
      activeTopic: updatedTopic.activeTopic,
      subtopic: updatedTopic.subtopic,
      intent: updatedTopic.intent,
      summary,
      entities,
      recentMessages,
      relevantMessages,
      resolvedPrompt: refResult.resolvedPrompt,
      confidence: refResult.confidence,
      clarificationNeeded,
      clarificationPrompt
    };
  }
}

export const contextResolver = new ContextResolver();
