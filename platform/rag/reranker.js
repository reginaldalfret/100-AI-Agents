/**
 * Sovereign AI Workbench — Lightweight Lexical-Semantic Reranker
 * High-precision deterministic reranking combining exact phrase matching,
 * query term density, heading/title boosting, code symbol matching, and RRF scores.
 *
 * 100% On-Premise, Air-Gapped, Zero GPU / Cloud Load.
 */

export class Reranker {
  constructor(options = {}) {
    this.phraseBoost = options.phraseBoost ?? 2.5;
    this.headingBoost = options.headingBoost ?? 1.8;
    this.densityWeight = options.densityWeight ?? 1.5;
    this.originalScoreWeight = options.originalScoreWeight ?? 1.0;
  }

  /**
   * Reranks candidate retrieval chunks for a query.
   * @param {string} query 
   * @param {Array<Object>} candidates - Array of retrieved chunk objects.
   * @param {Object} options - { topK, phraseBoost, headingBoost }
   * @returns {Array<Object>} Reranked chunk objects with rerankScore.
   */
  rerank(query, candidates, options = {}) {
    if (!query || !Array.isArray(candidates) || candidates.length === 0) {
      return candidates || [];
    }

    const topK = options.topK || candidates.length;
    const phraseBoost = options.phraseBoost ?? this.phraseBoost;
    const headingBoost = options.headingBoost ?? this.headingBoost;

    const queryLower = query.toLowerCase().trim();
    const queryTerms = queryLower
      .replace(/[^\w\s\-\.\:\/]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);

    if (queryTerms.length === 0) {
      return candidates.slice(0, topK);
    }

    const reranked = candidates.map(item => {
      const text = (item.text || '').toLowerCase();
      const enriched = (item.enrichedText || '').toLowerCase();
      const heading = (item.heading || '').toLowerCase();
      const fullContent = `${heading} ${enriched} ${text}`;

      let rerankScore = (item.score || item.rrfScore || item.vectorScore || item.bm25Score || 0) * this.originalScoreWeight;

      // 1. Exact Full Phrase Match Bonus
      if (fullContent.includes(queryLower) && queryLower.length > 3) {
        rerankScore += phraseBoost;
      }

      // 2. Query Term Coverage & Density
      let matchedTerms = 0;
      for (const term of queryTerms) {
        if (fullContent.includes(term)) {
          matchedTerms++;
        }
      }
      const termCoverageRatio = matchedTerms / queryTerms.length;
      rerankScore += termCoverageRatio * this.densityWeight;

      // 3. Heading / Title Match Bonus
      let headingMatches = 0;
      for (const term of queryTerms) {
        if (heading.includes(term)) {
          headingMatches++;
        }
      }
      if (headingMatches > 0) {
        rerankScore += (headingMatches / queryTerms.length) * headingBoost;
      }

      // 4. Code Symbol / Function Name Exact Match Bonus
      if (item.codeMetadata && item.codeMetadata.symbol) {
        const sym = item.codeMetadata.symbol.toLowerCase();
        for (const term of queryTerms) {
          if (sym.includes(term)) {
            rerankScore += 1.5;
            break;
          }
        }
      }

      // 5. Table Header Match Bonus
      if (item.tableMetadata && Array.isArray(item.tableMetadata.headers)) {
        const headersStr = item.tableMetadata.headers.join(' ').toLowerCase();
        for (const term of queryTerms) {
          if (headersStr.includes(term)) {
            rerankScore += 0.8;
            break;
          }
        }
      }

      return {
        ...item,
        originalScore: item.score,
        rerankScore,
        score: rerankScore,
        termCoverageRatio
      };
    });

    // Rank descending by rerankScore
    reranked.sort((a, b) => b.rerankScore - a.rerankScore);
    return reranked.slice(0, topK);
  }
}

export const reranker = new Reranker();
