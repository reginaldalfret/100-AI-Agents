/**
 * Sovereign AI Workbench — Contextual Prompt & Message Assembly Engine
 * Formulates model-ready multi-turn messages and prompt packages for Ollama / local neural runtimes.
 */

import { contextWindowManager } from './context-window.js';

export class ContextBuilder {
  /**
   * Builds the model-ready prompt and message payload.
   * @param {Object} params - { agent, resolvedContext, userPrompt, model, images }
   * @returns {Object} { systemPrompt, prompt, messages, traceMetadata }
   */
  buildModelPayload({ agent, resolvedContext = {}, userPrompt = '', model = '', images = [], evidencePack = '' }) {
    const rawSystemPrompt = agent?.system_prompt || (agent?.domain
      ? `You are ${agent.name}, an expert AI Agent specializing in ${agent.domain}. Provide accurate, clear, professional answers.`
      : 'You are a helpful industrial AI specialist.');

    const activeTopic = resolvedContext.activeTopic || '';
    const subtopic = resolvedContext.subtopic || '';
    const summary = resolvedContext.summary || '';
    const recentMessages = resolvedContext.recentMessages || [];
    const relevantMessages = resolvedContext.relevantMessages || [];
    const resolvedReferences = resolvedContext.resolvedReferences || [];

    // 1. Enrich System Prompt with active conversation context if available
    let enrichedSystemPrompt = rawSystemPrompt;
    if (activeTopic) {
      const topicContext = subtopic ? `${activeTopic} (${subtopic})` : activeTopic;
      enrichedSystemPrompt += `\n[Current Conversation Topic: ${topicContext}]`;
    }
    if (summary) {
      enrichedSystemPrompt += `\n[Prior Discussion Summary: ${summary}]`;
    }
    enrichedSystemPrompt += `\n[VISUAL CAPABILITY: When explaining workflows, system architectures, process sequences, or data breakdowns, you can include structured diagrams using markdown code blocks (e.g. \`\`\`mermaid or \`\`\`diagram) alongside your explanation.]`;

    // 2. Bound turns within context window
    const fitted = contextWindowManager.fitContext({
      systemPrompt: enrichedSystemPrompt,
      summary,
      relevantTurns: relevantMessages,
      recentTurns: recentMessages,
      currentPrompt: userPrompt
    });

    // 3. Assemble Normalized Messages Array for chat-completion APIs
    const messages = [];

    // Add relevant older context if any
    for (const msg of fitted.includedRelevant) {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      });
    }

    // Add recent turns
    for (const msg of fitted.includedRecent) {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      });
    }

    // Add current user prompt (enriched with RAG evidence if available)
    const ragEvidence = evidencePack || resolvedContext?.evidencePack || '';
    let contextualCurrentPrompt = userPrompt;
    if (ragEvidence) {
      contextualCurrentPrompt = `${userPrompt}\n\n${ragEvidence}`;
    }

    messages.push({
      role: 'user',
      content: contextualCurrentPrompt
    });

    // 4. Assemble Consolidated Prompt String for raw generation / streaming endpoints
    let consolidatedPrompt = '';

    // If we have prior messages, format them cleanly as a coherent conversational transcript
    if (fitted.includedRecent.length > 0 || fitted.includedRelevant.length > 0) {
      const priorConversationText = messages.slice(0, -1).map(m => {
        const speaker = m.role === 'assistant' ? (agent?.name || 'AI Assistant') : 'User';
        return `${speaker}: ${m.content}`;
      }).join('\n\n');

      consolidatedPrompt = `${priorConversationText}\n\nUser: ${contextualCurrentPrompt}\n\n${agent?.name || 'AI Assistant'}:`;
    } else {
      consolidatedPrompt = contextualCurrentPrompt;
    }

    return {
      systemPrompt: enrichedSystemPrompt,
      prompt: consolidatedPrompt,
      messages,
      contextMetadata: {
        activeTopic,
        subtopic,
        referencesResolved: resolvedReferences.length,
        recentTurnsCount: fitted.includedRecent.length,
        relevantTurnsCount: fitted.includedRelevant.length,
        estimatedTokens: fitted.estimatedTotalTokens
      }
    };
  }
}

export const contextBuilder = new ContextBuilder();
