/**
 * Sovereign AI Workbench — Deterministic Query Rewriter & Intent Classifier
 * Resolves anaphoric references using platform/context/reference-resolver.js,
 * classifies query complexity, determines retrieval necessity, and generates search expansions.
 *
 * 100% On-Premise, Air-Gapped, Zero External Cloud Dependencies.
 */

import { referenceResolver } from '../context/reference-resolver.js';

export const QueryComplexity = {
  SIMPLE_FACTUAL: 'SIMPLE_FACTUAL',
  MULTI_HOP: 'MULTI_HOP',
  COMPARATIVE: 'COMPARATIVE',
  CODE_SEARCH: 'CODE_SEARCH',
  TABULAR_QUERY: 'TABULAR_QUERY'
};

export class QueryRewriter {
  constructor(options = {}) {
    this.referenceResolver = options.referenceResolver || referenceResolver;
    
    // Domain Synonym & Acronym Mappings for Sub-Query Expansion
    this.domainSynonyms = new Map([
      ['cui', ['corrosion under insulation', 'insulation corrosion', 'piping inspection']],
      ['api-653', ['api 653', 'tank inspection', 'tank repair', 'minimum shell thickness']],
      ['api-570', ['api 570', 'piping inspection code', 'piping thickness']],
      ['oisd', ['oil industry safety directorate', 'safety standards']],
      ['corrosion', ['metal loss', 'wall loss', 'thinning', 'degradation', 'cracking']],
      ['retirement', ['minimum thickness', 't_min', 'condemning limit']],
      ['hydrocarbon', ['petroleum', 'fuel', 'crude', 'gasoline', 'diesel']],
      ['refinery', ['petrochemical plant', 'processing unit', 'refining']]
    ]);
  }

  /**
   * Evaluates whether a query requires knowledge base retrieval or can be answered directly.
   * @param {string} query - Raw user query.
   * @param {Object} [context] - Optional conversation context.
   * @returns {{ shouldRetrieve: boolean, reason: string }}
   */
  shouldRetrieve(query, context = {}) {
    if (!query || typeof query !== 'string') {
      return { shouldRetrieve: false, reason: 'Empty query' };
    }

    const clean = query.trim().toLowerCase();

    // 1. Skip pure greetings & social pleasantries
    if (/^(hi|hello|hey|good\s+(morning|afternoon|evening|day)|howdy|greetings)[!.\s]*$/i.test(clean)) {
      return { shouldRetrieve: false, reason: 'Conversational greeting' };
    }

    // 2. Skip platform meta-queries & agent identities
    if (/^(who\s+are\s+you|what\s+is\s+your\s+name|what\s+can\s+you\s+do|tell\s+me\s+about\s+yourself)[?.\s]*$/i.test(clean)) {
      return { shouldRetrieve: false, reason: 'Agent capability inquiry' };
    }

    // 3. Skip pure gratitude & sign-offs
    if (/^(thanks?|thank\s+you|bye|goodbye|see\s+you|cheers|got\s+it|ok|okay|cool|awesome)[!.\s]*$/i.test(clean)) {
      return { shouldRetrieve: false, reason: 'Conversational acknowledgement' };
    }

    // 4. Skip trivial math computations
    if (/^(\d+\s*[\+\-\*\/]\s*\d+\s*=?|\d+\s*\^\s*\d+)$/.test(clean)) {
      return { shouldRetrieve: false, reason: 'Simple arithmetic expression' };
    }

    // 5. Skip self-contained text formatting directives without knowledge lookups
    if (/^(format\s+this\s+as\s+json|uppercase\s+this|convert\s+to\s+snake_case|write\s+a\s+(poem|haiku|greeting))\b/i.test(clean) && !clean.includes('standard') && !clean.includes('document')) {
      return { shouldRetrieve: false, reason: 'Self-contained generative directive' };
    }

    return { shouldRetrieve: true, reason: 'Information query requires knowledge grounding' };
  }

  /**
   * Classifies the structural complexity and nature of the query.
   * @param {string} query
   * @returns {string} One of QueryComplexity enum values.
   */
  classifyComplexity(query) {
    if (!query || typeof query !== 'string') return QueryComplexity.SIMPLE_FACTUAL;
    const lower = query.toLowerCase();

    // Code Search heuristics
    if (/\b(function|class|method|import|export|const|let|def|struct|api|endpoint|sql|select|where|error|stack\s*trace)\b/i.test(lower) ||
        /\.[a-z]{2,4}\b/.test(lower) ||
        /```/.test(query)) {
      return QueryComplexity.CODE_SEARCH;
    }

    // Tabular / Spreadsheet heuristics
    if (/\b(table|sheet|row|column|cells?|spreadsheet|csv|xlsx|dataset|records?|matrix)\b/i.test(lower) ||
        /\b(max|min|average|sum|total|count|rows?\s+\d+)\b/i.test(lower)) {
      return QueryComplexity.TABULAR_QUERY;
    }

    // Comparative heuristics
    if (/\b(compare|versus|vs\.?|difference\s+between|which\s+(one\s+is\s+)?(better|faster|safer|higher)|pros\s+and\s+cons)\b/i.test(lower)) {
      return QueryComplexity.COMPARATIVE;
    }

    // Multi-Hop heuristics
    if (/\b(and\s+also|then\s+check|based\s+on\s+that|followed\s+by|calculate\s+.*?\s+using\s+.*?\s+standard)\b/i.test(lower) ||
        lower.split(/\b(and|then|also|additionally)\b/).length > 2) {
      return QueryComplexity.MULTI_HOP;
    }

    return QueryComplexity.SIMPLE_FACTUAL;
  }

  /**
   * Resolves anaphoric and conversational references in the user query against context.
   * @param {string} query - Raw user query.
   * @param {Object} context - Conversation context { recentMessages, activeTopic, subtopic, entities, replyTo }
   * @returns {Object} { rewrittenQuery, originalQuery, references, resolved, complexity }
   */
  rewrite(query, context = {}) {
    if (!query || typeof query !== 'string') {
      return {
        rewrittenQuery: '',
        originalQuery: query,
        references: [],
        resolved: false,
        complexity: QueryComplexity.SIMPLE_FACTUAL,
        expandedQueries: []
      };
    }

    const cleanQuery = query.trim();
    const complexity = this.classifyComplexity(cleanQuery);
    let rewrittenQuery = cleanQuery;
    let references = [];
    let resolved = false;

    // Use ReferenceResolver if available
    if (this.referenceResolver && typeof this.referenceResolver.resolveReferences === 'function') {
      try {
        const resolution = this.referenceResolver.resolveReferences(cleanQuery, context);
        if (resolution && resolution.resolved && resolution.references.length > 0) {
          resolved = true;
          references = resolution.references;

          // Enrich query with resolved targets
          const targets = references
            .map(r => r.target)
            .filter(Boolean)
            .join(' ');

          if (targets) {
            rewrittenQuery = `${cleanQuery} (${targets})`;
          }
        }
      } catch {
        // Fallback gracefully
      }
    }

    // Generate query expansion variants for better recall
    const expandedQueries = this.expandQuery(rewrittenQuery);

    return {
      rewrittenQuery,
      originalQuery: cleanQuery,
      references,
      resolved,
      complexity,
      expandedQueries
    };
  }

  /**
   * Generates search sub-queries and synonym-expanded variations.
   * @param {string} query
   * @returns {Array<string>}
   */
  expandQuery(query) {
    if (!query || typeof query !== 'string') return [];
    const expansions = new Set();
    const clean = query.trim();
    expansions.add(clean);

    const lower = clean.toLowerCase();

    // Check domain acronyms & synonyms
    for (const [key, syns] of this.domainSynonyms.entries()) {
      if (lower.includes(key)) {
        for (const syn of syns) {
          expansions.add(lower.replace(new RegExp(`\\b${key}\\b`, 'gi'), syn));
        }
      }
    }

    // Extract core noun phrases or identifiers
    const technicalSymbols = clean.match(/[A-Z0-9_\-]{3,}/g);
    if (technicalSymbols) {
      for (const sym of technicalSymbols) {
        expansions.add(sym);
      }
    }

    return Array.from(expansions).slice(0, 4);
  }
}

export const queryRewriter = new QueryRewriter();
