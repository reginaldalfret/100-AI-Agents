/**
 * Sovereign AI Workbench — Precise Citation Generator & Reference Formatter
 * Generates exact citations for PDF pages, Spreadsheet sheets/cells/rows,
 * and Source Code file line ranges with verifiable excerpts.
 *
 * 100% On-Premise, Air-Gapped, Zero External Cloud Dependencies.
 */

export class CitationGenerator {
  /**
   * Generates structured citation objects from an array of retrieved chunks.
   * @param {Array<Object>} chunks 
   * @returns {Array<Object>}
   */
  generateCitations(chunks) {
    if (!Array.isArray(chunks) || chunks.length === 0) return [];

    return chunks.map((chk, idx) => {
      const filename = chk.filename || 'unknown';
      const fileType = (chk.fileType || '').toLowerCase();
      const page = chk.pageNumber || chk.page || 1;
      const section = chk.heading || chk.sectionId || 'General';
      const chunkType = chk.chunkType || 'prose';
      const excerpt = this._createExcerpt(chk.text || chk.enrichedText || '');

      let citationText = '';
      let citationType = 'document';
      let codeRange = null;
      let sheetInfo = null;

      if (chunkType === 'code' || ['js', 'ts', 'py', 'sql', 'go', 'rs', 'c', 'cpp'].includes(fileType) || chk.startLine) {
        citationType = 'code';
        const startLine = chk.startLine || (chk.codeMetadata?.startLine) || 1;
        const endLine = chk.endLine || (chk.codeMetadata?.endLine) || (startLine + (chk.text?.split('\n').length || 1) - 1);
        const symbol = chk.codeMetadata?.symbol || section;
        codeRange = { startLine, endLine, symbol };
        citationText = `${filename}:L${startLine}-L${endLine} (${symbol})`;
      } else if (chunkType === 'table' || ['xlsx', 'csv', 'tsv'].includes(fileType) || chk.tableMetadata) {
        citationType = 'spreadsheet';
        const sheetName = chk.tableMetadata?.tableName || section;
        const startRow = chk.tableMetadata?.startRow || 1;
        const endRow = chk.tableMetadata?.endRow || (chk.tableMetadata?.totalRows || 20);
        sheetInfo = { sheetName, startRow, endRow };
        citationText = `${filename} [${sheetName}, Rows ${startRow}-${endRow}]`;
      } else {
        citationType = 'document';
        citationText = `${filename}, Page ${page}, Section '${section}'`;
      }

      return {
        id: idx + 1,
        documentId: chk.documentId,
        filename,
        fileType,
        page,
        section,
        citationType,
        citationText,
        inlineCitation: `[${citationText}]`,
        codeRange,
        sheetInfo,
        excerpt,
        score: chk.score || chk.rerankScore || chk.vectorScore || chk.bm25Score || 0
      };
    });
  }

  /**
   * Formats a list of citations into markdown reference footnotes.
   * @param {Array<Object>} citations 
   * @returns {string}
   */
  formatMarkdownReferences(citations) {
    if (!Array.isArray(citations) || citations.length === 0) return '';

    const lines = ['### Citations & Sources'];
    citations.forEach((c, idx) => {
      lines.push(`${idx + 1}. **${c.filename}** — ${c.citationText}`);
      if (c.excerpt) {
        lines.push(`   > "${c.excerpt}"`);
      }
    });
    return lines.join('\n');
  }

  /**
   * Formats an inline citation string for a single chunk.
   * @param {Object} chunk 
   * @returns {string}
   */
  formatInlineCitation(chunk) {
    const citations = this.generateCitations([chunk]);
    return citations.length > 0 ? citations[0].inlineCitation : '[Unknown Source]';
  }

  _createExcerpt(text, maxChars = 200) {
    if (!text) return '';
    const clean = text.replace(/\s+/g, ' ').trim();
    if (clean.length <= maxChars) return clean;
    return clean.slice(0, maxChars - 3) + '...';
  }
}

export const citationGenerator = new CitationGenerator();
