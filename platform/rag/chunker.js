/**
 * Sovereign AI Workbench — Structure-Aware Semantic Chunker
 * Preserves sections, headings, table structures (with header repetition),
 * code blocks (with file paths and line bounds), page numbers, and SHA-256 chunk hashes.
 *
 * 100% On-Premise, Air-Gapped, Zero External Cloud Dependencies.
 */

import crypto from 'node:crypto';

export class Chunker {
  constructor(options = {}) {
    this.targetChunkChars = options.targetChunkChars || 2000; // ~500 tokens
    this.minChunkChars = options.minChunkChars || 200;
    this.overlapChars = options.overlapChars || 350; // ~85 tokens
    this.maxTableRowsPerChunk = options.maxTableRowsPerChunk || 30;
  }

  /**
   * Chunks a normalized document from DocumentIngestion into structured, searchable RAG chunks.
   * @param {Object} document - Normalized document object.
   * @param {Object} options - Custom chunking parameters.
   * @returns {Array<Object>} Array of structured chunk objects.
   */
  chunkDocument(document, options = {}) {
    if (!document) return [];

    const targetChars = options.targetChunkChars || this.targetChunkChars;
    const overlap = options.overlapChars || this.overlapChars;
    const docId = document.documentId || 'doc_unknown';
    const filename = document.filename || 'document.txt';
    const namespace = document.namespace || 'GLOBAL';

    const chunks = [];
    let chunkIndex = 0;

    // 1. Process structured tables first (preserving table headers and row ranges)
    if (Array.isArray(document.tables) && document.tables.length > 0) {
      for (const table of document.tables) {
        const tableChunks = this._chunkTable(table, document, chunkIndex);
        chunks.push(...tableChunks);
        chunkIndex += tableChunks.length;
      }
    }

    // 2. Process sections (PDF pages, DOCX headings, Markdown sections, Code symbols)
    const isTableDoc = ['csv', 'tsv', 'xlsx'].includes(document.fileType) && Array.isArray(document.tables) && document.tables.length > 0;
    if (!isTableDoc && Array.isArray(document.sections) && document.sections.length > 0) {
      for (const section of document.sections) {
        const sectionChunks = this._chunkSection(section, document, chunkIndex, targetChars, overlap);
        chunks.push(...sectionChunks);
        chunkIndex += sectionChunks.length;
      }
    } else if (document.rawText && chunks.length === 0) {
      // 3. Fallback: Process raw text if no sections were generated
      const textChunks = this._chunkRawText(document.rawText, document, chunkIndex, targetChars, overlap);
      chunks.push(...textChunks);
    }

    // 4. Enrich and deduplicate chunk hashes
    return chunks.map((chk, idx) => {
      const chunkId = `${docId}_chk_${String(idx).padStart(4, '0')}`;
      const contextPrefix = `[Document: ${filename} | Section: ${chk.heading || 'General'} | Page: ${chk.pageNumber || 1}]`;
      const enrichedText = `${contextPrefix}\n${chk.text.trim()}`;
      
      const chunkHash = crypto
        .createHash('sha256')
        .update(`${docId}:${enrichedText}:${chk.pageNumber || 1}`)
        .digest('hex');

      return {
        ...chk,
        chunkId,
        documentId: docId,
        filename,
        namespace,
        fileType: document.fileType,
        mimeType: document.mimeType,
        contextPrefix,
        enrichedText,
        chunkHash,
        tokenEstimate: Math.ceil(enrichedText.length / 4),
        charCount: enrichedText.length,
        createdAt: document.createdAt || new Date().toISOString()
      };
    });
  }

  /**
   * Chunks a structured table, repeating headers across chunks to prevent orphan rows.
   */
  _chunkTable(table, document, startIndex) {
    const chunks = [];
    const headers = table.headers || [];
    const rows = table.rows || [];
    if (headers.length === 0 || rows.length === 0) return chunks;

    const maxRows = this.maxTableRowsPerChunk;
    const totalRows = rows.length;

    for (let r = 0; r < totalRows; r += maxRows) {
      const slice = rows.slice(r, r + maxRows);
      const rowRange = `Rows ${r + 1}-${Math.min(r + maxRows, totalRows)} of ${totalRows}`;
      
      // Build markdown table with headers repeated
      let mdTable = `### Table: ${table.tableName} (${rowRange})\n\n`;
      mdTable += `| ${headers.join(' | ')} |\n`;
      mdTable += `| ${headers.map(() => '---').join(' | ')} |\n`;

      for (const row of slice) {
        mdTable += `| ${headers.map(h => row[h] || '').join(' | ')} |\n`;
      }

      chunks.push({
        heading: `Table: ${table.tableName}`,
        pageNumber: 1,
        text: mdTable,
        chunkType: 'table',
        tableMetadata: {
          tableName: table.tableName,
          totalRows,
          startRow: r + 1,
          endRow: Math.min(r + maxRows, totalRows),
          headers
        }
      });
    }

    return chunks;
  }

  /**
   * Chunks a single logical section, respecting paragraph boundaries and target size.
   */
  _chunkSection(section, document, startIndex, targetChars, overlap) {
    const content = (section.content || '').trim();
    if (!content) return [];

    const heading = section.heading || 'General';
    const pageNumber = section.page || 1;
    const isCode = section.sectionId?.startsWith('sym_') || ['js', 'mjs', 'cjs', 'ts', 'py', 'sql', 'go', 'rs', 'c', 'cpp'].includes(document.fileType);
    const startLine = section.startLine || 1;
    const lineCount = content.split('\n').length;
    const endLine = section.endLine || (startLine + lineCount - 1);

    if (content.length <= targetChars + overlap) {
      return [{
        heading,
        pageNumber,
        text: content,
        chunkType: isCode ? 'code' : 'prose',
        sectionId: section.sectionId,
        startLine,
        endLine,
        codeMetadata: isCode ? {
          symbol: section.symbolName || heading,
          symbolType: section.symbolType || 'symbol',
          startLine,
          endLine
        } : null
      }];
    }

    // Split by paragraphs or code lines
    const delimiter = isCode ? '\n' : '\n\n';
    const blocks = content.split(delimiter).filter(b => b.trim().length > 0);
    const chunks = [];

    let currentChunk = [];
    let currentLen = 0;
    let runningLineOffset = 0;

    for (const block of blocks) {
      const blockLineCount = block.split('\n').length;
      if (currentLen + block.length > targetChars && currentChunk.length > 0) {
        const chunkText = currentChunk.join(delimiter);
        const chunkLines = chunkText.split('\n').length;
        const chkStartLine = startLine + runningLineOffset;
        const chkEndLine = chkStartLine + chunkLines - 1;

        chunks.push({
          heading,
          pageNumber,
          text: chunkText,
          chunkType: isCode ? 'code' : 'prose',
          sectionId: section.sectionId,
          startLine: chkStartLine,
          endLine: chkEndLine,
          codeMetadata: isCode ? {
            symbol: section.symbolName || heading,
            symbolType: section.symbolType || 'symbol',
            startLine: chkStartLine,
            endLine: chkEndLine
          } : null
        });

        // Compute overlap retention
        let retained = [];
        let retainedLen = 0;
        for (let i = currentChunk.length - 1; i >= 0; i--) {
          if (retainedLen + currentChunk[i].length <= overlap) {
            retained.unshift(currentChunk[i]);
            retainedLen += currentChunk[i].length;
          } else {
            break;
          }
        }

        runningLineOffset += (chunkLines - retained.join(delimiter).split('\n').length);
        currentChunk = retained;
        currentLen = retainedLen;
      }

      currentChunk.push(block);
      currentLen += block.length;
    }

    if (currentChunk.length > 0) {
      const chunkText = currentChunk.join(delimiter);
      const chunkLines = chunkText.split('\n').length;
      const chkStartLine = startLine + runningLineOffset;
      const chkEndLine = chkStartLine + chunkLines - 1;

      chunks.push({
        heading,
        pageNumber,
        text: chunkText,
        chunkType: isCode ? 'code' : 'prose',
        sectionId: section.sectionId,
        startLine: chkStartLine,
        endLine: chkEndLine,
        codeMetadata: isCode ? {
          symbol: section.symbolName || heading,
          symbolType: section.symbolType || 'symbol',
          startLine: chkStartLine,
          endLine: chkEndLine
        } : null
      });
    }

    return chunks;
  }

  /**
   * Fallback sliding window for unstructured text
   */
  _chunkRawText(text, document, startIndex, targetChars, overlap) {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
      let end = start + targetChars;
      if (end < text.length) {
        // Find nearest clean whitespace or sentence end
        const boundary = text.lastIndexOf('\n', end);
        if (boundary > start + targetChars * 0.7) {
          end = boundary;
        }
      } else {
        end = text.length;
      }

      const chunkText = text.slice(start, end).trim();
      if (chunkText.length >= this.minChunkChars || chunks.length === 0) {
        chunks.push({
          heading: 'General',
          pageNumber: Math.max(1, Math.ceil(start / 3000)),
          text: chunkText,
          chunkType: 'prose'
        });
      }

      if (end >= text.length) break;
      start = end - overlap;
    }

    return chunks;
  }
}

export const chunker = new Chunker();
