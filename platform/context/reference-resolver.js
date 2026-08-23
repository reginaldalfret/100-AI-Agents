/**
 * Sovereign AI Workbench — Deterministic Coreference & Anaphora Resolver
 * Resolves references (it, this, that, the second one, that code, expand it, etc.)
 * against conversation state, entities, topics, and recent turns without expensive LLM roundtrips.
 */

import { ReferenceType, ContextConfidenceLevel } from './schemas.js';

export class ReferenceResolver {
  /**
   * Resolves references in the current prompt given conversation history and entity memory.
   * @param {string} prompt - Current user query
   * @param {Object} context - { recentMessages, activeTopic, subtopic, entities, replyTo }
   * @returns {Object} { resolved: boolean, resolvedPrompt: string, references: Array, confidence: number, ambiguity: Object|null }
   */
  resolveReferences(prompt, context = {}) {
    if (!prompt || typeof prompt !== 'string') {
      return { resolved: false, resolvedPrompt: prompt, references: [], confidence: 1.0, ambiguity: null };
    }

    const cleanPrompt = prompt.trim();
    const lower = cleanPrompt.toLowerCase();
    const recentMessages = context.recentMessages || [];
    const activeTopic = context.activeTopic || '';
    const subtopic = context.subtopic || '';
    const entities = context.entities || [];
    const replyTo = context.replyTo || null;

    const references = [];
    let ambiguity = null;
    let confidence = ContextConfidenceLevel.HIGH;

    // Fast-path: If prompt is self-contained with no anaphoric triggers and no prior history
    if (recentMessages.length === 0 && !replyTo) {
      return { resolved: false, resolvedPrompt: cleanPrompt, references: [], confidence: 1.0, ambiguity: null };
    }

    // 1. Check Reply-To context first (Highest priority direct binding)
    if (replyTo && replyTo.content) {
      const targetSummary = replyTo.preview || replyTo.content.slice(0, 140);
      references.push({
        type: ReferenceType.TEMPORAL,
        surface: 'replyTo',
        target: targetSummary,
        confidence: 0.99
      });
    }

    // 2. Pronoun & Demonstrative References ("it", "this", "that", "these", "those")
    const pronounPattern = /\b(it|this|that|these|those|its)\b/i;
    if (pronounPattern.test(cleanPrompt)) {
      // Find what "it/this/that" points to:
      // Priority 1: Active subtopic or main topic
      // Priority 2: Subject of the immediately preceding assistant or user turn
      let candidate = '';
      if (activeTopic) {
        candidate = subtopic ? `${activeTopic} (${subtopic})` : activeTopic;
      }

      if (!candidate && recentMessages.length > 0) {
        const lastTurn = recentMessages[recentMessages.length - 1];
        const lastUserTurn = [...recentMessages].reverse().find(m => m.role === 'user');
        if (lastUserTurn && lastUserTurn.content) {
          candidate = this._extractSubject(lastUserTurn.content);
        } else if (lastTurn && lastTurn.content) {
          candidate = this._extractSubject(lastTurn.content);
        }
      }

      if (candidate) {
        references.push({
          type: ReferenceType.PRONOUN,
          surface: cleanPrompt.match(pronounPattern)[1],
          target: candidate,
          confidence: 0.95
        });
      }
    }

    // 3. Ordinal References ("the first one", "the second one", "the third", "the latter", "the former")
    const ordinalMatch = cleanPrompt.match(/\b(the\s+)?(first|second|third|fourth|fifth|former|latter)(\s+(one|item|point|type|option))?\b/i);
    if (ordinalMatch) {
      const ordinalKey = ordinalMatch[2].toLowerCase();
      let index = -1;
      if (ordinalKey === 'first' || ordinalKey === 'former') index = 0;
      else if (ordinalKey === 'second' || ordinalKey === 'latter') index = 1;
      else if (ordinalKey === 'third') index = 2;
      else if (ordinalKey === 'fourth') index = 3;
      else if (ordinalKey === 'fifth') index = 4;

      // Check candidate lists from entity memory or previous turn
      const listEntities = entities.filter(e => e.type === 'list_item' || e.type === 'subtopic' || e.type === 'concept');
      if (listEntities.length > index && index >= 0) {
        const resolvedEntity = listEntities[index];
        references.push({
          type: ReferenceType.ORDINAL,
          surface: ordinalMatch[0],
          target: resolvedEntity.name || resolvedEntity.id,
          index,
          confidence: 0.92
        });
      } else {
        // Look in recent assistant messages for numbered or bulleted items
        const lastAiTurn = [...recentMessages].reverse().find(m => m.role === 'assistant');
        if (lastAiTurn && lastAiTurn.content) {
          const items = this._extractListItems(lastAiTurn.content);
          if (items.length > index && index >= 0) {
            references.push({
              type: ReferenceType.ORDINAL,
              surface: ordinalMatch[0],
              target: items[index],
              index,
              confidence: 0.90
            });
          }
        }
      }
    }

    // 4. Relative/Comparative "Which one is best / most suitable for X"
    if (/\bwhich\s+one\b/i.test(cleanPrompt) || /\bwhich\s+(of\s+them|is\s+best|is\s+most)\b/i.test(cleanPrompt)) {
      if (activeTopic) {
        references.push({
          type: ReferenceType.COMPARATIVE,
          surface: 'which one',
          target: `options under topic '${activeTopic}'`,
          confidence: 0.92
        });
      }
    }

    // 5. Artifact References ("that article", "that code", "the table", "the document", "the image")
    const artifactMatch = cleanPrompt.match(/\b(the|that|this)\s+(article|code|script|function|table|report|document|image|photo|diagram|drawing|presentation|slides?)\b/i);
    if (artifactMatch) {
      const artifactType = artifactMatch[2].toLowerCase();
      let targetDesc = '';
      if (['code', 'script', 'function'].includes(artifactType)) {
        const lastCodeTurn = [...recentMessages].reverse().find(m => m.content && (m.content.includes('```') || m.content.includes('def ') || m.content.includes('function')));
        targetDesc = lastCodeTurn ? 'the code previously generated in this conversation' : activeTopic;
      } else if (['image', 'photo', 'diagram', 'drawing'].includes(artifactType)) {
        targetDesc = 'the visual asset previously discussed in this conversation';
      } else if (['article', 'report', 'document'].includes(artifactType)) {
        targetDesc = activeTopic ? `the ${artifactType} on '${activeTopic}'` : 'the document previously generated';
      }

      references.push({
        type: ReferenceType.ARTIFACT,
        surface: artifactMatch[0],
        target: targetDesc || activeTopic,
        confidence: 0.94
      });
    }

    // 6. Action Directives ("expand it", "shorten it", "make it simpler", "optimize it", "add error handling")
    const actionMatch = cleanPrompt.match(/\b(expand|shorten|summarize|rewrite|optimize|refactor|add\s+\w+|make\s+it\s+\w+|explain\s+(further|more))\b/i);
    if (actionMatch && recentMessages.length > 0) {
      const lastTurn = recentMessages[recentMessages.length - 1];
      references.push({
        type: ReferenceType.ACTION,
        surface: actionMatch[0],
        target: `the previous response regarding '${activeTopic || 'the ongoing discussion'}'`,
        confidence: 0.95
      });
    }

    // Construct enriched resolved prompt if references exist
    let resolvedPrompt = cleanPrompt;
    if (references.length > 0) {
      const primeTarget = references.find(r => r.type === ReferenceType.PRONOUN || r.type === ReferenceType.ORDINAL || r.type === ReferenceType.ARTIFACT);
      if (primeTarget && primeTarget.target) {
        // e.g. "write about the types in it" with target "renewable energy"
        // Formulate clear contextual framing for the LLM
        resolvedPrompt = `${cleanPrompt}`;
      }
    }

    return {
      resolved: references.length > 0,
      resolvedPrompt,
      references,
      confidence: references.length > 0 ? Math.min(...references.map(r => r.confidence)) : 1.0,
      ambiguity
    };
  }

  _extractSubject(text) {
    if (!text || typeof text !== 'string') return '';
    const clean = text.trim()
      .replace(/^(please\s+|can\s+you\s+|write\s+(a|an|about)\s+|draft\s+|explain\s+|analyze\s+|tell\s+me\s+about\s+)/i, '')
      .replace(/[?.!]+$/, '')
      .trim();
    return clean.slice(0, 80);
  }

  _extractListItems(content) {
    if (!content || typeof content !== 'string') return [];
    const lines = content.split('\n');
    const items = [];
    for (const line of lines) {
      const match = line.match(/^(\d+\.|\*|-)\s+\*?\*?([A-Za-z0-9\s_-]+)\*?\*?[:\-–]?/);
      if (match && match[2]) {
        const item = match[2].trim();
        if (item.length >= 2 && item.length <= 40) {
          items.push(item);
        }
      }
    }
    return items;
  }
}

export const referenceResolver = new ReferenceResolver();
