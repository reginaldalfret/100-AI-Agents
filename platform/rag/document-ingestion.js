/**
 * Sovereign AI Workbench — Canonical Document Ingestion Engine
 * Handles SHA-256 deduplication, file validation, format normalization
 * (PDF native stream text, DOCX headings/paragraphs/tables, XLSX sheets/ranges,
 * CSV rows, code files with language/symbols, plain text, and Gemma 3 multimodal observations).
 *
 * 100% On-Premise, Air-Gapped, Zero External Cloud Dependencies.
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

export const SupportedMimeTypes = {
  PDF: 'application/pdf',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  CSV: 'text/csv',
  TSV: 'text/tab-separated-values',
  JSON: 'application/json',
  MARKDOWN: 'text/markdown',
  PLAIN_TEXT: 'text/plain',
  JAVASCRIPT: 'text/javascript',
  TYPESCRIPT: 'text/typescript',
  PYTHON: 'text/x-python',
  SQL: 'text/x-sql',
  HTML: 'text/html',
  YAML: 'text/yaml',
  IMAGE_OBSERVATION: 'application/vnd.sovereign.image-observation'
};

export const IngestionNamespace = {
  GLOBAL: 'GLOBAL',
  AGENT: 'AGENT',
  PROJECT: 'PROJECT',
  CONVERSATION: 'CONVERSATION',
  ATTACHMENT: 'ATTACHMENT'
};

export class DocumentIngestion {
  constructor(options = {}) {
    this.maxFileSizeBytes = options.maxFileSizeBytes || 50 * 1024 * 1024; // 50MB
    this.allowedExtensions = new Set([
      '.pdf', '.docx', '.xlsx', '.csv', '.tsv', '.txt', '.md', '.json',
      '.js', '.mjs', '.cjs', '.ts', '.py', '.sql', '.html', '.css',
      '.yaml', '.yml', '.sh', '.ps1', '.c', '.cpp', '.rs', '.go', '.java'
    ]);
  }

  /**
   * Ingest a file from disk path.
   * @param {string} filePath - Absolute or relative file path.
   * @param {Object} options - { namespace, documentId, tags, customMetadata, forceReingest }
   * @returns {Promise<Object>} Normalized Document Object
   */
  async ingestFile(filePath, options = {}) {
    const resolvedPath = path.resolve(filePath);
    const stat = await fsp.stat(resolvedPath);

    if (!stat.isFile()) {
      throw new Error(`Invalid path: '${resolvedPath}' is not a regular file.`);
    }

    if (stat.size > this.maxFileSizeBytes) {
      throw new Error(`File '${path.basename(resolvedPath)}' exceeds maximum size of ${this.maxFileSizeBytes} bytes.`);
    }

    const buffer = await fsp.readFile(resolvedPath);
    const filename = path.basename(resolvedPath);
    const ext = path.extname(filename).toLowerCase();

    return this.ingestBuffer(buffer, filename, this._inferMimeType(filename), {
      ...options,
      sourcePath: resolvedPath,
      fileSize: stat.size,
      mtime: stat.mtimeMs
    });
  }

  /**
   * Ingest in-memory buffer or string.
   * @param {Buffer|string} data - Buffer or string payload.
   * @param {string} filename - Filename with extension.
   * @param {string} mimeType - MIME type.
   * @param {Object} options - Metadata options.
   * @returns {Promise<Object>} Normalized Document Object
   */
  async ingestBuffer(data, filename, mimeType, options = {}) {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, typeof data === 'string' ? 'utf8' : undefined);
    
    if (!buffer || buffer.length === 0) {
      throw new Error(`Cannot ingest empty document: '${filename}'`);
    }

    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const ext = path.extname(filename).toLowerCase();
    const inferredMime = mimeType || this._inferMimeType(filename);
    const namespace = options.namespace || IngestionNamespace.GLOBAL;
    const documentId = options.documentId || `doc_${sha256.slice(0, 16)}`;

    let normalized;
    if (ext === '.pdf' || inferredMime === SupportedMimeTypes.PDF) {
      normalized = await this._parsePdf(buffer, filename);
    } else if (ext === '.docx' || inferredMime === SupportedMimeTypes.DOCX) {
      normalized = await this._parseDocx(buffer, filename);
    } else if (ext === '.xlsx' || inferredMime === SupportedMimeTypes.XLSX) {
      normalized = await this._parseXlsx(buffer, filename);
    } else if (ext === '.csv' || ext === '.tsv' || inferredMime === SupportedMimeTypes.CSV || inferredMime === SupportedMimeTypes.TSV) {
      normalized = this._parseCsv(buffer.toString('utf8'), filename, ext === '.tsv');
    } else if (['.js', '.mjs', '.cjs', '.ts', '.py', '.sql', '.html', '.css', '.yaml', '.yml', '.sh', '.ps1', '.c', '.cpp', '.rs', '.go', '.java'].includes(ext)) {
      normalized = this._parseCode(buffer.toString('utf8'), filename, ext);
    } else if (ext === '.json' || inferredMime === SupportedMimeTypes.JSON) {
      normalized = this._parseJson(buffer.toString('utf8'), filename);
    } else {
      normalized = this._parsePlainText(buffer.toString('utf8'), filename);
    }

    return {
      documentId,
      filename,
      fileType: ext ? ext.slice(1) : 'txt',
      mimeType: inferredMime,
      namespace,
      sha256,
      sizeBytes: buffer.length,
      createdAt: new Date().toISOString(),
      sourcePath: options.sourcePath || null,
      tags: options.tags || [],
      customMetadata: options.customMetadata || {},
      pageCount: normalized.pageCount || 1,
      sections: normalized.sections || [],
      tables: normalized.tables || [],
      codeSymbols: normalized.codeSymbols || [],
      rawText: normalized.rawText || '',
      summary: normalized.summary || ''
    };
  }

  /**
   * Ingest multimodal image observations generated by Google Gemma 3 Vision.
   * @param {Object} observation - { imageId, filename, observations, ocrText, boundingBoxes, metadata }
   * @param {Object} options - Namespace and tag options.
   * @returns {Object} Normalized Document Object
   */
  ingestMultimodalObservation(observation, options = {}) {
    if (!observation || !observation.filename) {
      throw new Error('Invalid multimodal observation payload');
    }

    const filename = observation.filename;
    const obsText = Array.isArray(observation.observations) 
      ? observation.observations.join('\n\n') 
      : (observation.observations || '');
    const ocrText = observation.ocrText || '';
    const combinedContent = [
      `[Image Observation: ${filename}]`,
      observation.caption ? `Caption: ${observation.caption}` : '',
      obsText ? `Visual Analysis:\n${obsText}` : '',
      ocrText ? `Extracted Text (OCR):\n${ocrText}` : ''
    ].filter(Boolean).join('\n\n');

    const sha256 = crypto.createHash('sha256').update(combinedContent).digest('hex');
    const documentId = options.documentId || `img_${sha256.slice(0, 16)}`;
    const namespace = options.namespace || IngestionNamespace.ATTACHMENT;

    const sections = [
      {
        sectionId: 'visual-summary',
        heading: `Visual Observation: ${filename}`,
        page: 1,
        content: obsText || observation.caption || ''
      }
    ];

    if (ocrText) {
      sections.push({
        sectionId: 'ocr-text',
        heading: `OCR Text: ${filename}`,
        page: 1,
        content: ocrText
      });
    }

    return {
      documentId,
      filename,
      fileType: 'image_observation',
      mimeType: SupportedMimeTypes.IMAGE_OBSERVATION,
      namespace,
      sha256,
      sizeBytes: Buffer.byteLength(combinedContent, 'utf8'),
      createdAt: new Date().toISOString(),
      sourcePath: observation.sourcePath || null,
      tags: [...(options.tags || []), 'multimodal', 'gemma-vision'],
      customMetadata: {
        ...(options.customMetadata || {}),
        boundingBoxes: observation.boundingBoxes || [],
        imageDimensions: observation.dimensions || null
      },
      pageCount: 1,
      sections,
      tables: observation.tables || [],
      codeSymbols: [],
      rawText: combinedContent,
      summary: observation.caption || (obsText.slice(0, 200) + '...')
    };
  }

  // =========================================================================
  // FORMAT PARSERS (100% Local, Zero Cloud Dependencies)
  // =========================================================================

  /**
   * PDF Parser — Native Stream Text + Decompression + Page Detection
   */
  async _parsePdf(buffer, filename) {
    const rawLatin = buffer.toString('latin1');
    const sections = [];
    const tables = [];
    let fullText = '';

    // Decompress PDF FlateDecode streams if present
    const streamRegex = /<<[^>]*\/Filter\s*\/FlateDecode[^>]*>>\s*stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let match;
    const extractedStreams = [];

    while ((match = streamRegex.exec(rawLatin)) !== null) {
      try {
        const streamBytes = Buffer.from(match[1], 'latin1');
        let uncompressed;
        try {
          uncompressed = zlib.inflateSync(streamBytes);
        } catch {
          uncompressed = zlib.inflateRawSync(streamBytes);
        }
        if (uncompressed) {
          extractedStreams.push(uncompressed.toString('latin1'));
        }
      } catch {
        // Stream decompression failed or wasn't raw zlib, continue
      }
    }

    const allContent = rawLatin + '\n' + extractedStreams.join('\n');

    // Detect pages via /Type /Page markers
    const pageSplits = allContent.split(/\/Type\s*\/Page\b/);
    const estimatedPages = Math.max(1, (allContent.match(/\/Type\s*\/Page\b/g) || []).length);

    // Extract text operators (Tj, TJ, ', ", BT/ET blocks)
    let extractedText = this._extractPdfTextOperators(allContent);
    extractedText = this._cleanPdfNoise(extractedText);

    if (!extractedText.trim()) {
      // Fallback to ASCII readable runs
      extractedText = this._extractReadableAscii(rawLatin);
      extractedText = this._cleanPdfNoise(extractedText);
    }

    // Split extracted text into logical sections based on headings or page estimates
    const rawSections = this._splitIntoSections(extractedText, filename);
    sections.push(...rawSections);
    fullText = extractedText;

    return {
      pageCount: estimatedPages,
      sections,
      tables,
      codeSymbols: [],
      rawText: fullText,
      summary: fullText.slice(0, 300).trim()
    };
  }

  _extractPdfTextOperators(content) {
    const textPieces = [];

    // Match BT ... ET blocks
    const btRegex = /BT([\s\S]*?)ET/g;
    let btMatch;

    while ((btMatch = btRegex.exec(content)) !== null) {
      const block = btMatch[1];

      // Match () Tj
      const tjRegex = /\(([^)]*)\)\s*Tj/g;
      let tjMatch;
      while ((tjMatch = tjRegex.exec(block)) !== null) {
        textPieces.push(this._unescapePdfString(tjMatch[1]));
      }

      // Match [ (...) ... ] TJ
      const arrayTjRegex = /\[([\s\S]*?)\]\s*TJ/g;
      let arrayMatch;
      while ((arrayMatch = arrayTjRegex.exec(block)) !== null) {
        const inner = arrayMatch[1];
        const innerStrings = inner.match(/\(([^)]*)\)/g);
        if (innerStrings) {
          const joined = innerStrings
            .map(s => this._unescapePdfString(s.slice(1, -1)))
            .join('');
          textPieces.push(joined);
        }
      }

      // Match Hex strings <...> Tj
      const hexTjRegex = /<([0-9a-fA-F]+)>\s*Tj/g;
      let hexMatch;
      while ((hexMatch = hexTjRegex.exec(block)) !== null) {
        const hexStr = hexMatch[1];
        let decoded = '';
        for (let i = 0; i < hexStr.length; i += 2) {
          decoded += String.fromCharCode(parseInt(hexStr.slice(i, i + 2), 16));
        }
        textPieces.push(decoded);
      }
    }

    return textPieces.join(' ');
  }

  _unescapePdfString(str) {
    return str
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\\\/g, '\\');
  }

  _cleanPdfNoise(text) {
    if (!text) return '';
    return text
      .replace(/c2pa[^\n]{0,200}/gi, '')
      .replace(/<x:xmpmeta[\s\S]*?<\/x:xmpmeta>/gi, '')
      .replace(/<rdf:RDF[\s\S]*?<\/rdf:RDF>/gi, '')
      .replace(/\/[A-Z][a-zA-Z0-9<>[\]/ ]{2,50}/g, ' ')
      .replace(/\b[0-9a-fA-F]{32,64}\b/g, '')
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  _extractReadableAscii(raw) {
    const matches = raw.match(/[\x20-\x7E\t\r\n]{4,}/g);
    return matches ? matches.join(' ') : '';
  }

  /**
   * DOCX Parser — Unpacks PKZip, extracts word/document.xml with Headings & Tables
   */
  async _parseDocx(buffer, filename) {
    const zipEntries = this._unpackZip(buffer);
    const documentXml = zipEntries['word/document.xml'] || zipEntries['document.xml'];

    if (!documentXml) {
      return this._parsePlainText(buffer.toString('utf8'), filename);
    }

    const xmlText = documentXml.toString('utf8');
    const sections = [];
    const tables = [];
    let fullText = '';

    // Extract Tables <w:tbl>...</w:tbl>
    const tblRegex = /<w:tbl[\s\S]*?<\/w:tbl>/g;
    let tblMatch;
    let tableIndex = 1;

    while ((tblMatch = tblRegex.exec(xmlText)) !== null) {
      const tblXml = tblMatch[0];
      const parsedTable = this._parseDocxTableXml(tblXml, `${filename} - Table ${tableIndex++}`);
      if (parsedTable && parsedTable.rows.length > 0) {
        tables.push(parsedTable);
      }
    }

    // Extract Paragraphs with Headings and Text
    const pRegex = /<w:p[\s\S]*?<\/w:p>/g;
    let pMatch;
    let currentHeading = 'General';
    let currentSectionContent = [];
    let sectionIdx = 1;

    while ((pMatch = pRegex.exec(xmlText)) !== null) {
      const pXml = pMatch[0];
      const headingMatch = pXml.match(/<w:pStyle\s+w:val="Heading(\d+)"/i) || pXml.match(/<w:pStyle\s+w:val="(Title|Subtitle|Heading)"/i);
      const textMatches = pXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
      
      let pText = '';
      if (textMatches) {
        pText = textMatches.map(m => m.replace(/<[^>]+>/g, '')).join('');
      }

      if (!pText.trim()) continue;

      if (headingMatch) {
        if (currentSectionContent.length > 0) {
          sections.push({
            sectionId: `sec_${sectionIdx++}`,
            heading: currentHeading,
            page: 1,
            content: currentSectionContent.join('\n\n')
          });
          currentSectionContent = [];
        }
        currentHeading = pText.trim();
      } else {
        currentSectionContent.push(pText.trim());
      }
    }

    if (currentSectionContent.length > 0) {
      sections.push({
        sectionId: `sec_${sectionIdx++}`,
        heading: currentHeading,
        page: 1,
        content: currentSectionContent.join('\n\n')
      });
    }

    fullText = sections.map(s => `## ${s.heading}\n${s.content}`).join('\n\n');

    return {
      pageCount: Math.max(1, Math.ceil(sections.length / 3)),
      sections,
      tables,
      codeSymbols: [],
      rawText: fullText,
      summary: fullText.slice(0, 300).trim()
    };
  }

  _parseDocxTableXml(tblXml, tableName) {
    const rowMatches = tblXml.match(/<w:tr[\s\S]*?<\/w:tr>/g);
    if (!rowMatches || rowMatches.length === 0) return null;

    const rows = [];
    for (const rXml of rowMatches) {
      const cellMatches = rXml.match(/<w:tc[\s\S]*?<\/w:tc>/g);
      if (!cellMatches) continue;
      const cellTexts = cellMatches.map(cXml => {
        const tMatches = cXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
        return tMatches ? tMatches.map(m => m.replace(/<[^>]+>/g, '')).join('').trim() : '';
      });
      rows.push(cellTexts);
    }

    if (rows.length === 0) return null;

    const headers = rows[0].map((h, i) => h || `Col_${i + 1}`);
    const dataRows = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] || '';
      });
      return obj;
    });

    return {
      tableName,
      headers,
      rows: dataRows
    };
  }

  /**
   * XLSX Parser — Unpacks PKZip, extracts sharedStrings.xml, workbook.xml, sheets
   */
  async _parseXlsx(buffer, filename) {
    const zipEntries = this._unpackZip(buffer);
    const sharedStrings = [];

    // Parse xl/sharedStrings.xml
    const sharedXml = zipEntries['xl/sharedStrings.xml'];
    if (sharedXml) {
      const siMatches = sharedXml.toString('utf8').match(/<si>[\s\S]*?<\/si>/g) || [];
      for (const si of siMatches) {
        const tMatches = si.match(/<t[^>]*>([^<]*)<\/t>/g) || [];
        const str = tMatches.map(t => t.replace(/<[^>]+>/g, '')).join('');
        sharedStrings.push(str);
      }
    }

    // Parse workbook sheets
    const workbookXml = zipEntries['xl/workbook.xml'] ? zipEntries['xl/workbook.xml'].toString('utf8') : '';
    const sheetMap = {};
    const sheetMatches = workbookXml.match(/<sheet\s+name="([^"]+)"\s+sheetId="(\d+)"[^>]*r:id="([^"]+)"/g) || [];
    
    let sheetCounter = 1;
    for (const sm of sheetMatches) {
      const nameMatch = sm.match(/name="([^"]+)"/);
      if (nameMatch) {
        sheetMap[`sheet${sheetCounter}`] = nameMatch[1];
        sheetCounter++;
      }
    }

    const tables = [];
    const sections = [];

    // Parse each sheet
    for (const [entryPath, entryBuffer] of Object.entries(zipEntries)) {
      if (entryPath.startsWith('xl/worksheets/sheet') && entryPath.endsWith('.xml')) {
        const sheetNum = entryPath.match(/sheet(\d+)\.xml/)?.[1] || '1';
        const sheetName = sheetMap[`sheet${sheetNum}`] || `Sheet${sheetNum}`;
        const sheetXml = entryBuffer.toString('utf8');

        const parsedTable = this._parseXlsxSheetXml(sheetXml, sharedStrings, `${filename} - Sheet: ${sheetName}`);
        if (parsedTable && parsedTable.rows.length > 0) {
          tables.push(parsedTable);

          // Convert to markdown table format for text retrieval
          let md = `### Sheet: ${sheetName}\n\n`;
          md += `| ${parsedTable.headers.join(' | ')} |\n`;
          md += `| ${parsedTable.headers.map(() => '---').join(' | ')} |\n`;
          for (const row of parsedTable.rows.slice(0, 100)) {
            md += `| ${parsedTable.headers.map(h => row[h] || '').join(' | ')} |\n`;
          }

          sections.push({
            sectionId: `sheet_${sheetNum}`,
            heading: `Spreadsheet: ${sheetName}`,
            page: parseInt(sheetNum, 10),
            content: md
          });
        }
      }
    }

    const fullText = sections.map(s => s.content).join('\n\n');

    return {
      pageCount: Math.max(1, tables.length),
      sections,
      tables,
      codeSymbols: [],
      rawText: fullText,
      summary: fullText.slice(0, 300).trim()
    };
  }

  _parseXlsxSheetXml(sheetXml, sharedStrings, tableName) {
    const rowMatches = sheetXml.match(/<row\s+r="(\d+)"[\s\S]*?<\/row>/g) || [];
    if (rowMatches.length === 0) return null;

    const grid = [];

    for (const rXml of rowMatches) {
      const rowIdx = parseInt(rXml.match(/r="(\d+)"/)?.[1] || '1', 10) - 1;
      const cMatches = rXml.match(/<c\s+r="([A-Z]+)(\d+)"([^>]*)>([\s\S]*?)<\/c>/g) || [];
      
      for (const cXml of cMatches) {
        const colLetter = cXml.match(/r="([A-Z]+)\d+"/)?.[1] || 'A';
        const colIdx = this._colLetterToIndex(colLetter);
        const isString = cXml.includes('t="s"');
        const valMatch = cXml.match(/<v>([^<]*)<\/v>/);
        let cellVal = '';

        if (valMatch) {
          if (isString) {
            const strIdx = parseInt(valMatch[1], 10);
            cellVal = sharedStrings[strIdx] || '';
          } else {
            cellVal = valMatch[1];
          }
        }

        if (!grid[rowIdx]) grid[rowIdx] = [];
        grid[rowIdx][colIdx] = cellVal;
      }
    }

    const cleanGrid = grid.filter(Boolean).map(row => {
      const maxCol = row.length;
      const filled = [];
      for (let i = 0; i < maxCol; i++) {
        filled.push(row[i] || '');
      }
      return filled;
    });

    if (cleanGrid.length === 0) return null;

    const headers = cleanGrid[0].map((h, i) => h || `Col_${i + 1}`);
    const rows = cleanGrid.slice(1).map(r => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = r[i] || '';
      });
      return obj;
    });

    return {
      tableName,
      headers,
      rows
    };
  }

  _colLetterToIndex(col) {
    let index = 0;
    for (let i = 0; i < col.length; i++) {
      index = index * 26 + (col.charCodeAt(i) - 64);
    }
    return index - 1;
  }

  /**
   * Minimalist Zero-Dependency PKZip Reader for DOCX/XLSX containers
   */
  _unpackZip(buffer) {
    const entries = {};
    let offset = 0;

    while (offset < buffer.length - 4) {
      const sig = buffer.readUInt32LE(offset);
      if (sig === 0x04034b50) { // Local file header
        const compressionMethod = buffer.readUInt16LE(offset + 8);
        const compressedSize = buffer.readUInt32LE(offset + 18);
        const uncompressedSize = buffer.readUInt32LE(offset + 22);
        const fileNameLen = buffer.readUInt16LE(offset + 26);
        const extraFieldLen = buffer.readUInt16LE(offset + 28);

        const fileName = buffer.toString('utf8', offset + 30, offset + 30 + fileNameLen);
        const dataOffset = offset + 30 + fileNameLen + extraFieldLen;
        const compressedData = buffer.slice(dataOffset, dataOffset + compressedSize);

        if (compressedSize > 0 && !fileName.endsWith('/')) {
          try {
            let decompressed;
            if (compressionMethod === 0) {
              decompressed = compressedData;
            } else if (compressionMethod === 8) { // DEFLATE
              decompressed = zlib.inflateRawSync(compressedData);
            }
            if (decompressed) {
              entries[fileName] = decompressed;
            }
          } catch {
            // Non-critical entry decompress fail
          }
        }

        offset = dataOffset + compressedSize;
      } else {
        offset++;
      }
    }

    return entries;
  }

  /**
   * CSV / TSV Parser
   */
  _parseCsv(content, filename, isTsv = false) {
    const delimiter = isTsv ? '\t' : this._detectDelimiter(content);
    const lines = this._splitCsvLines(content);
    if (lines.length === 0) {
      return { pageCount: 1, sections: [], tables: [], codeSymbols: [], rawText: content, summary: '' };
    }

    const headers = this._parseCsvRow(lines[0], delimiter);
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const cells = this._parseCsvRow(lines[i], delimiter);
      if (cells.length === 0 || (cells.length === 1 && !cells[0])) continue;
      const rowObj = {};
      headers.forEach((h, idx) => {
        rowObj[h || `col_${idx + 1}`] = cells[idx] || '';
      });
      rows.push(rowObj);
    }

    const table = {
      tableName: filename,
      headers,
      rows
    };

    let md = `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n`;
    for (const r of rows.slice(0, 200)) {
      md += `| ${headers.map(h => r[h] || '').join(' | ')} |\n`;
    }

    const sections = [{
      sectionId: 'table_1',
      heading: `Table Data: ${filename}`,
      page: 1,
      content: md
    }];

    return {
      pageCount: Math.max(1, Math.ceil(rows.length / 50)),
      sections,
      tables: [table],
      codeSymbols: [],
      rawText: md,
      summary: `Tabular dataset ${filename} with ${rows.length} rows and ${headers.length} columns.`
    };
  }

  _detectDelimiter(text) {
    const sample = text.slice(0, 1000);
    const commas = (sample.match(/,/g) || []).length;
    const semicolons = (sample.match(/;/g) || []).length;
    const tabs = (sample.match(/\t/g) || []).length;
    const pipes = (sample.match(/\|/g) || []).length;

    if (tabs >= commas && tabs >= semicolons && tabs >= pipes) return '\t';
    if (semicolons > commas && semicolons > pipes) return ';';
    if (pipes > commas) return '|';
    return ',';
  }

  _splitCsvLines(text) {
    return text.split(/\r?\n/).filter(l => l.trim().length > 0);
  }

  _parseCsvRow(line, delimiter) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  /**
   * Code File Parser — Extracts functions, classes, interfaces, and methods with line numbers
   */
  _parseCode(content, filename, ext) {
    const lines = content.split(/\r?\n/);
    const codeSymbols = [];
    const sections = [];

    // Language heuristics
    const symbolRegexes = [
      // JavaScript / TypeScript / Node.js
      { type: 'class', regex: /^\s*(?:export\s+)?(?:default\s+)?class\s+([A-Za-z0-9_$]+)/ },
      { type: 'function', regex: /^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_$]+)/ },
      { type: 'const_func', regex: /^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z0-9_$]+)\s*=>/ },
      // Python
      { type: 'py_class', regex: /^\s*class\s+([A-Za-z0-9_]+)(?:\([^)]*\))?:/ },
      { type: 'py_func', regex: /^\s*(?:async\s+)?def\s+([A-Za-z0-9_]+)\s*\(/ },
      // Rust / Go / C / C++
      { type: 'rs_fn', regex: /^\s*(?:pub\s+)?fn\s+([A-Za-z0-9_]+)/ },
      { type: 'go_func', regex: /^\s*func\s+(?:\([^)]*\)\s*)?([A-Za-z0-9_]+)\s*\(/ }
    ];

    let currentSymbol = null;
    let currentContent = [];

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      let matchedSymbol = null;

      for (const { type, regex } of symbolRegexes) {
        const m = line.match(regex);
        if (m && m[1]) {
          matchedSymbol = { name: m[1], type, startLine: lineNum };
          break;
        }
      }

      if (matchedSymbol) {
        if (currentSymbol) {
          currentSymbol.endLine = lineNum - 1;
          codeSymbols.push(currentSymbol);
          sections.push({
            sectionId: `sym_${currentSymbol.name}_${currentSymbol.startLine}`,
            heading: `${currentSymbol.type.toUpperCase()}: ${currentSymbol.name} (lines ${currentSymbol.startLine}-${currentSymbol.endLine})`,
            page: Math.ceil(currentSymbol.startLine / 50),
            content: currentContent.join('\n'),
            startLine: currentSymbol.startLine,
            endLine: currentSymbol.endLine,
            symbolName: currentSymbol.name,
            symbolType: currentSymbol.type
          });
          currentContent = [];
        }
        currentSymbol = matchedSymbol;
      }

      currentContent.push(line);
    });

    if (currentSymbol) {
      currentSymbol.endLine = lines.length;
      codeSymbols.push(currentSymbol);
      sections.push({
        sectionId: `sym_${currentSymbol.name}_${currentSymbol.startLine}`,
        heading: `${currentSymbol.type.toUpperCase()}: ${currentSymbol.name} (lines ${currentSymbol.startLine}-${currentSymbol.endLine})`,
        page: Math.ceil(currentSymbol.startLine / 50),
        content: currentContent.join('\n'),
        startLine: currentSymbol.startLine,
        endLine: currentSymbol.endLine,
        symbolName: currentSymbol.name,
        symbolType: currentSymbol.type
      });
    }

    if (sections.length === 0) {
      sections.push({
        sectionId: 'code_full',
        heading: `Code: ${filename}`,
        page: 1,
        content: content,
        startLine: 1,
        endLine: lines.length
      });
    }

    return {
      pageCount: Math.max(1, Math.ceil(lines.length / 50)),
      sections,
      tables: [],
      codeSymbols,
      rawText: content,
      summary: `Source code file ${filename} containing ${lines.length} lines and ${codeSymbols.length} exported symbols.`
    };
  }

  /**
   * JSON Parser
   */
  _parseJson(content, filename) {
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return this._parsePlainText(content, filename);
    }

    const sections = [];
    if (typeof parsed === 'object' && parsed !== null) {
      if (Array.isArray(parsed)) {
        sections.push({
          sectionId: 'json_array',
          heading: `Array Data: ${filename}`,
          page: 1,
          content: JSON.stringify(parsed.slice(0, 50), null, 2)
        });
      } else {
        for (const [key, val] of Object.entries(parsed)) {
          sections.push({
            sectionId: `key_${key}`,
            heading: `Property: ${key}`,
            page: 1,
            content: typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)
          });
        }
      }
    }

    return {
      pageCount: 1,
      sections,
      tables: [],
      codeSymbols: [],
      rawText: content,
      summary: `JSON configuration/data file ${filename}.`
    };
  }

  /**
   * Plain Text & Markdown Parser
   */
  _parsePlainText(content, filename) {
    const sections = this._splitIntoSections(content, filename);
    return {
      pageCount: Math.max(1, Math.ceil(sections.length / 2)),
      sections,
      tables: [],
      codeSymbols: [],
      rawText: content,
      summary: content.slice(0, 300).trim()
    };
  }

  _splitIntoSections(text, filename) {
    const lines = text.split(/\r?\n/);
    const sections = [];
    let currentHeading = `Document: ${filename}`;
    let currentLines = [];
    let sectionIdx = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headingMatch = line.match(/^(#{1,4})\s+(.+)$/) || line.match(/^([A-Z0-9\s._-]{3,60}):\s*$/);

      if (headingMatch) {
        if (currentLines.length > 0) {
          sections.push({
            sectionId: `sec_${sectionIdx++}`,
            heading: currentHeading,
            page: Math.ceil(i / 40) || 1,
            content: currentLines.join('\n').trim()
          });
          currentLines = [];
        }
        currentHeading = headingMatch[2] || headingMatch[1];
      } else {
        currentLines.push(line);
      }
    }

    if (currentLines.length > 0) {
      sections.push({
        sectionId: `sec_${sectionIdx++}`,
        heading: currentHeading,
        page: Math.ceil(lines.length / 40) || 1,
        content: currentLines.join('\n').trim()
      });
    }

    return sections.filter(s => s.content.length > 0);
  }

  _inferMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
      case '.pdf': return SupportedMimeTypes.PDF;
      case '.docx': return SupportedMimeTypes.DOCX;
      case '.xlsx': return SupportedMimeTypes.XLSX;
      case '.csv': return SupportedMimeTypes.CSV;
      case '.tsv': return SupportedMimeTypes.TSV;
      case '.json': return SupportedMimeTypes.JSON;
      case '.md': return SupportedMimeTypes.MARKDOWN;
      case '.js':
      case '.mjs':
      case '.cjs': return SupportedMimeTypes.JAVASCRIPT;
      case '.ts': return SupportedMimeTypes.TYPESCRIPT;
      case '.py': return SupportedMimeTypes.PYTHON;
      case '.sql': return SupportedMimeTypes.SQL;
      case '.html': return SupportedMimeTypes.HTML;
      case '.yaml':
      case '.yml': return SupportedMimeTypes.YAML;
      default: return SupportedMimeTypes.PLAIN_TEXT;
    }
  }
}

export const documentIngestion = new DocumentIngestion();
