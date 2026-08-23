/**
 * Sovereign AI Workbench — Context-Aware RAG Query Reference Resolver
 * Deterministically rewrites anaphoric and ordinal query references ("it", "this report",
 * "the second finding", "the latter") into self-contained RAG retrieval queries.
 *
 * 100% On-Premise, Air-Gapped, Zero LLM Roundtrips.
 */

export class RAGReferenceResolver {
  /**
   * Resolves references in a RAG query using conversation and entity context.
   * @param {string} query - Raw user query.
   * @param {Object} context - { recentMessages, activeTopic, subtopic, entities, previousFindings }
   * @returns {Object} { resolved: boolean, resolvedQuery: string, originalQuery: string, confidence: number, resolvedReferences: Array }
   */
  resolveQuery(query, context = {}) {
    if (!query || typeof query !== 'string') {
      return { resolved: false, resolvedQuery: query, originalQuery: query, confidence: 1.0, resolvedReferences: [] };
    }

    const cleanQuery = query.trim();
    const activeTopic = context.activeTopic || '';
    const subtopic = context.subtopic || '';
    const recentMessages = context.recentMessages || [];
    const entities = context.entities || [];
    const previousFindings = context.previousFindings || [];

    const resolvedReferences = [];
    let rewritten = cleanQuery;

    // 1. Ordinal References ("the first finding", "the second one", "the third recommendation", "the latter", "the former")
    const ordinalPattern = /\b(the\s+)?(first|second|third|fourth|fifth|former|latter)(\s+(one|finding|item|point|recommendation|standard|section|rule|option))?\b/i;
    const ordinalMatch = cleanQuery.match(ordinalPattern);

    if (ordinalMatch) {
      const ordinalKey = ordinalMatch[2].toLowerCase();
      let index = -1;
      if (ordinalKey === 'first' || ordinalKey === 'former') index = 0;
      else if (ordinalKey === 'second' || ordinalKey === 'latter') index = 1;
      else if (ordinalKey === 'third') index = 2;
      else if (ordinalKey === 'fourth') index = 3;
      else if (ordinalKey === 'fifth') index = 4;

      let targetItem = null;

      // Check explicit previous findings
      if (previousFindings.length > index && index >= 0) {
        targetItem = previousFindings[index];
      } else if (entities.length > index && index >= 0) {
        targetItem = entities[index].name || entities[index].title || entities[index];
      } else {
        // Extract from recent assistant messages
        const lastAiTurn = [...recentMessages].reverse().find(m => m.role === 'assistant');
        if (lastAiTurn && lastAiTurn.content) {
          const listItems = this._extractNumberedItems(lastAiTurn.content);
          if (listItems.length > index && index >= 0) {
            targetItem = listItems[index];
          }
        }
      }

      if (targetItem) {
        const itemText = typeof targetItem === 'object' ? (targetItem.title || targetItem.name || targetItem.text || JSON.stringify(targetItem)) : String(targetItem);
        resolvedReferences.push({
          type: 'ORDINAL',
          surface: ordinalMatch[0],
          target: itemText,
          index,
          confidence: 0.94
        });

        rewritten = rewritten.replace(ordinalMatch[0], `${itemText}`);
      }
    }

    // 2. Pronoun & Demonstrative References ("it", "this report", "that document", "these limits", "its requirements")
    const pronounPattern = /\b(it|this|that|these|those|its)\b/i;
    if (pronounPattern.test(rewritten)) {
      let targetSubject = '';
      if (activeTopic) {
        targetSubject = subtopic ? `${activeTopic} - ${subtopic}` : activeTopic;
      } else if (recentMessages.length > 0) {
        const lastUserTurn = [...recentMessages].reverse().find(m => m.role === 'user');
        if (lastUserTurn && lastUserTurn.content) {
          targetSubject = this._extractTopicFromQuery(lastUserTurn.content);
        }
      }

      if (targetSubject) {
        // Replace demonstrative phrases e.g. "this report", "that code", "it"
        const specificDemonstrative = rewritten.match(/\b(this|that|the)\s+(report|document|code|standard|specification|table|data)\b/i);
        if (specificDemonstrative) {
          resolvedReferences.push({
            type: 'DEMONSTRATIVE_NOUN',
            surface: specificDemonstrative[0],
            target: targetSubject,
            confidence: 0.92
          });
          rewritten = rewritten.replace(specificDemonstrative[0], `${targetSubject} ${specificDemonstrative[2]}`);
        } else {
          resolvedReferences.push({
            type: 'PRONOUN',
            surface: rewritten.match(pronounPattern)[1],
            target: targetSubject,
            confidence: 0.90
          });
          rewritten = `${rewritten} (${targetSubject})`;
        }
      }
    }

    return {
      resolved: resolvedReferences.length > 0,
      resolvedQuery: rewritten.trim(),
      originalQuery: cleanQuery,
      confidence: resolvedReferences.length > 0 ? Math.min(...resolvedReferences.map(r => r.confidence)) : 1.0,
      resolvedReferences
    };
  }

  _extractNumberedItems(content) {
    if (!content || typeof content !== 'string') return [];
    const lines = content.split('\n');
    const items = [];

    for (const line of lines) {
      const match = line.match(/^(\d+\.|\*|-)\s+\*?\*?([A-Za-z0-9\s_\-()]+)\*?\*?[:\-–]?/);
      if (match && match[2]) {
        const item = match[2].trim();
        if (item.length >= 2 && item.length <= 80) {
          items.push(item);
        }
      }
    }
    return items;
  }

  _extractTopicFromQuery(text) {
    if (!text) return '';
    return text.trim()
      .replace(/^(what\s+is|how\s+does|explain|show\s+me|tell\s+me\s+about|find|query)\s+/i, '')
      .replace(/[?.!]+$/, '')
      .slice(0, 60);
  }
}

export const ragReferenceResolver = new RAGReferenceResolver();
