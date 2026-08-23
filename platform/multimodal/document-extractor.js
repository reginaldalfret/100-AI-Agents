/**
 * Sovereign AI Workbench — Universal Multimodal Document & File Extractor
 * Parses text, PDFs, CSVs, JSON, code, tables, and images locally with zero external calls.
 *
 * PDF Architecture: PAGE-FIRST, CONTENT-FIRST
 * 1. Extract native text from PDF text operators (Tj, TJ, ', ")
 * 2. Scan BT/ET text blocks for readable content
 * 3. Filter metadata (C2PA, XMP, PDF internals) from content
 * 4. Only flag for Gemma 3 vision when native text is insufficient
 */

import path from 'node:path';

// ============================================================
// PDF METADATA PATTERNS — things that are NOT page content
// ============================================================
const METADATA_PATTERNS = [
  // C2PA / Content Credentials
  /c2pa[^\n]{0,200}/gi,
  /content\s*credentials?[^\n]{0,200}/gi,
  /urn:uuid:[0-9a-f-]{36}/gi,
  /c2pa\.assertions/gi,
  /c2pa\.claim/gi,
  /c2pa\.hash\.\w+/gi,
  /contentauth\.org[^\s]*/gi,

  // XMP Metadata
  /<x:xmpmeta[\s\S]*?<\/x:xmpmeta>/gi,
  /<rdf:RDF[\s\S]*?<\/rdf:RDF>/gi,
  /xmlns:\w+="[^"]*"/gi,
  /<dc:\w+>[\s\S]*?<\/dc:\w+>/gi,
  /<xmp:\w+>[\s\S]*?<\/xmp:\w+>/gi,
  /<pdf:\w+>[\s\S]*?<\/pdf:\w+>/gi,
  /<photoshop:\w+>[\s\S]*?<\/photoshop:\w+>/gi,

  // PDF internal structure markers
  /\d+\s+\d+\s+obj/g,
  /endobj/g,
  /stream\r?\n/g,
  /endstream/g,
  /startxref/g,
  /%%EOF/g,
  /xref\s+\d+\s+\d+/g,
  /trailer\s*<</g,

  // PDF dictionary entries (not content)
  /\/Type\s*\/\w+/g,
  /\/Subtype\s*\/\w+/g,
  /\/Filter\s*\/\w+/g,
  /\/Length\s+\d+/g,
  /\/MediaBox\s*\[[^\]]+\]/g,
  /\/CropBox\s*\[[^\]]+\]/g,
  /\/Resources\s*<</g,
  /\/Font\s*<</g,
  /\/FontDescriptor/g,
  /\/Encoding\s*\/\w+/g,
  /\/BaseFont\s*\/[\w+-]+/g,
  /\/Producer\s*\([^)]*\)/g,
  /\/Creator\s*\([^)]*\)/g,
  /\/CreationDate\s*\([^)]*\)/g,
  /\/ModDate\s*\([^)]*\)/g,
  /\/Author\s*\([^)]*\)/g,
  /\/Title\s*\([^)]*\)/g,

  // Hashes, checksums, binary-like strings
  /[0-9a-f]{40,}/gi,
  /sha256:[0-9a-f]+/gi,
  /sha384:[0-9a-f]+/gi,
  /sha512:[0-9a-f]+/gi,
];

// Patterns that indicate the extracted text is mostly metadata/noise, not content
const NOISE_INDICATORS = [
  /^%PDF-/,
  /^\s*\d+\s+\d+\s+obj/,
  /xref\s+\d+/,
  /\/Type\s*\/Catalog/,
  /\/Type\s*\/Page\b(?!s)/,
  /c2pa/i,
  /<x:xmpmeta/i,
  /startxref/,
  /trailer\s*<</,
];

export class DocumentExtractor {
  /**
   * Extracts clean, structured content from an uploaded attachment.
   * @param {Object} attachment - { name, type, size, data (base64 or text) }
   * @returns {Object} ExtractedDocument
   */
  async extractContent(attachment) {
    if (!attachment || !attachment.name) {
      return null;
    }

    const filename = attachment.name;
    const ext = path.extname(filename).toLowerCase();
    const mimeType = attachment.type || '';
    const rawData = attachment.data || '';

    let extractedText = '';
    let contentText = '';
    let metadataText = '';
    let tables = [];
    let isMultimodalImage = false;
    let base64Image = null;
    let docType = 'text';
    let pageCount = 0;
    let pages = [];
    let needsVision = false;

    // 1. Image Formats -> Pass to Gemma 3 Vision
    if (mimeType.startsWith('image/') || /\.(png|jpe?g|webp|bmp|gif|tiff)$/i.test(filename)) {
      isMultimodalImage = true;
      base64Image = this._normalizeBase64(rawData);
      docType = 'image';
      extractedText = `[Image Attached: ${filename} (Visual Analysis by Google Gemma 3 Vision Engine)]`;
      contentText = extractedText;
    }

    // 2. CSV / TSV -> Structured Table Extraction
    else if (ext === '.csv' || ext === '.tsv' || mimeType.includes('csv')) {
      docType = 'table';
      const textContent = this._decodeBase64OrText(rawData);
      const delimiter = ext === '.tsv' ? '\t' : ',';
      const lines = textContent.split(/\r?\n/).filter(l => l.trim().length > 0);
      
      if (lines.length > 0) {
        const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
          const cells = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
          const rowObj = {};
          headers.forEach((h, idx) => {
            rowObj[h || `col_${idx + 1}`] = cells[idx] || '';
          });
          rows.push(rowObj);
        }
        tables.push({ tableName: filename, headers, rows });
        
        // Format as Markdown table
        let mdTable = `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n`;
        rows.slice(0, 50).forEach(r => {
          mdTable += `| ${headers.map(h => r[h] || '').join(' | ')} |\n`;
        });
        extractedText = mdTable;
        contentText = extractedText;
      } else {
        extractedText = textContent;
        contentText = extractedText;
      }
    }

    // 3. JSON / Code / Text files
    else if (['.txt', '.md', '.json', '.yaml', '.yml', '.xml', '.html', '.js', '.py', '.sql', '.css', '.c', '.cpp', '.rs', '.go'].includes(ext)) {
      docType = 'code_or_text';
      extractedText = this._decodeBase64OrText(rawData);
      contentText = extractedText;
    }

    // 4. PDF Documents — PAGE-FIRST CONTENT-FIRST EXTRACTION
    else if (ext === '.pdf' || mimeType.includes('pdf')) {
      docType = 'pdf';
      const rawBytes = this._decodeBase64ToBuffer(rawData);
      const rawDecoded = rawBytes.toString('latin1'); // Use latin1 to preserve byte values

      // Step 1: Detect page count
      pageCount = this._detectPdfPageCount(rawDecoded);

      // Step 2: Extract native text using multiple strategies
      const nativeText = this._extractPdfNativeText(rawDecoded);

      // Step 3: Extract metadata separately
      metadataText = this._extractPdfMetadata(rawDecoded);

      // Step 4: Clean the native text — remove any metadata that leaked in
      contentText = this._filterMetadataFromContent(nativeText);

      // Step 5: Determine if vision is needed
      if (contentText.trim().length < 10) {
        // Native text extraction failed — might be a scanned PDF
        // Try readable-string fallback (but filtered)
        const fallbackText = this._extractReadableStrings(rawDecoded);
        const filteredFallback = this._filterMetadataFromContent(fallbackText);
        
        if (filteredFallback.trim().length >= 10) {
          contentText = filteredFallback;
        } else {
          // Truly scanned or image-based PDF — needs Gemma 3 Vision
          needsVision = true;
          isMultimodalImage = false;
          base64Image = null;
          contentText = `[PDF requires OCR - no extractable text found in: ${filename}]`;
        }
      }

      // Build page structure
      pages = [{
        pageNumber: 1,
        text: contentText,
        contentType: needsVision ? 'scanned' : 'text',
        hasImages: needsVision,
        hasVisualContent: needsVision
      }];

      if (pageCount > 1) {
        for (let i = 2; i <= pageCount; i++) {
          pages.push({
            pageNumber: i,
            text: '',
            contentType: 'text',
            hasImages: false,
            hasVisualContent: false
          });
        }
      }

      extractedText = contentText;
    }

    // 5. DOCX / XLSX / Binary Documents
    else {
      docType = 'document';
      const rawDecoded = this._decodeBase64OrText(rawData);
      extractedText = rawDecoded.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s{3,}/g, ' ').slice(0, 4000);
      if (!extractedText.trim()) {
        extractedText = `[Attached Document: ${filename}]`;
      }
      contentText = extractedText;
    }

    return {
      filename,
      extension: ext,
      docType,
      size: attachment.size || rawData.length,
      extractedText: (contentText || extractedText).trim(),
      contentText: (contentText || '').trim(),
      metadataText: (metadataText || '').trim(),
      pageCount: pageCount || 0,
      pages,
      tables,
      isMultimodalImage,
      needsVision,
      base64Image
    };
  }

  // ============================================================
  // PDF TEXT EXTRACTION — Multi-Strategy Native Text Parser
  // ============================================================

  /**
   * Extract native text from PDF using multiple PDF text operator strategies.
   * Handles: (text) Tj, [(text)] TJ, (text) ', (text) ", <hex> Tj
   */
  _extractPdfNativeText(rawPdf) {
    const textParts = [];

    // Strategy 1: Extract text from BT...ET text blocks
    const btEtBlocks = this._extractBtEtBlocks(rawPdf);
    for (const block of btEtBlocks) {
      const blockText = this._extractTextFromBlock(block);
      if (blockText.trim()) {
        textParts.push(blockText.trim());
      }
    }

    // Strategy 2: Global Tj/TJ extraction (catches text outside well-formed BT/ET)
    if (textParts.join(' ').trim().length < 10) {
      const globalText = this._extractTextOperators(rawPdf);
      if (globalText.trim()) {
        textParts.push(globalText.trim());
      }
    }

    return textParts.join(' ').trim();
  }

  /**
   * Find all BT (Begin Text) ... ET (End Text) blocks in the PDF.
   */
  _extractBtEtBlocks(rawPdf) {
    const blocks = [];
    const btPattern = /\bBT\b/g;
    let match;

    while ((match = btPattern.exec(rawPdf)) !== null) {
      const startIdx = match.index + match[0].length;
      const etIdx = rawPdf.indexOf('ET', startIdx);
      if (etIdx > startIdx && (etIdx - startIdx) < 50000) {
        blocks.push(rawPdf.substring(startIdx, etIdx));
      }
    }

    return blocks;
  }

  /**
   * Extract text from a single BT...ET block using all PDF text operators.
   */
  _extractTextFromBlock(block) {
    const parts = [];

    // Match (string) Tj — single string show
    const tjMatches = block.matchAll(/\(([^)]*)\)\s*Tj/g);
    for (const m of tjMatches) {
      const decoded = this._decodePdfString(m[1]);
      if (decoded.trim()) parts.push(decoded);
    }

    // Match [(string)(string)] TJ — array show (most common in modern PDFs)
    const tjArrayMatches = block.matchAll(/\[([^\]]*)\]\s*TJ/gi);
    for (const m of tjArrayMatches) {
      const arrayContent = m[1];
      const stringParts = arrayContent.matchAll(/\(([^)]*)\)/g);
      for (const sp of stringParts) {
        const decoded = this._decodePdfString(sp[1]);
        if (decoded) parts.push(decoded);
      }
      const hexParts = arrayContent.matchAll(/<([0-9a-fA-F]+)>/g);
      for (const hp of hexParts) {
        const decoded = this._decodeHexString(hp[1]);
        if (decoded.trim()) parts.push(decoded);
      }
    }

    // Match (string) ' — move to next line and show
    const singleQuoteMatches = block.matchAll(/\(([^)]*)\)\s*'/g);
    for (const m of singleQuoteMatches) {
      const decoded = this._decodePdfString(m[1]);
      if (decoded.trim()) parts.push('\n' + decoded);
    }

    // Match (string) " — set spacing, move to next line and show
    const doubleQuoteMatches = block.matchAll(/\(([^)]*)\)\s*"/g);
    for (const m of doubleQuoteMatches) {
      const decoded = this._decodePdfString(m[1]);
      if (decoded.trim()) parts.push('\n' + decoded);
    }

    // Match <hex> Tj — hex-encoded string show
    const hexTjMatches = block.matchAll(/<([0-9a-fA-F]+)>\s*Tj/gi);
    for (const m of hexTjMatches) {
      const decoded = this._decodeHexString(m[1]);
      if (decoded.trim()) parts.push(decoded);
    }

    return parts.join('');
  }

  /**
   * Global text operator extraction — fallback for PDFs without clean BT/ET structure.
   */
  _extractTextOperators(rawPdf) {
    const parts = [];

    // (text) Tj
    const tjMatches = rawPdf.matchAll(/\(([^)]{1,500})\)\s*Tj/g);
    for (const m of tjMatches) {
      const decoded = this._decodePdfString(m[1]);
      if (decoded.trim()) parts.push(decoded);
    }

    // [(text array)] TJ
    const tjArrayMatches = rawPdf.matchAll(/\[([^\]]{1,2000})\]\s*TJ/gi);
    for (const m of tjArrayMatches) {
      const stringParts = m[1].matchAll(/\(([^)]*)\)/g);
      for (const sp of stringParts) {
        const decoded = this._decodePdfString(sp[1]);
        if (decoded) parts.push(decoded);
      }
    }

    return parts.join(' ');
  }

  /**
   * Decode a PDF string literal — handles escape sequences.
   */
  _decodePdfString(str) {
    if (!str) return '';
    return str
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\b/g, '\b')
      .replace(/\\f/g, '\f')
      .replace(/\\\\/g, '\\')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\(\d{1,3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)));
  }

  /**
   * Decode a PDF hex string <AABB...> to text.
   */
  _decodeHexString(hex) {
    if (!hex || hex.length < 2) return '';
    let result = '';
    const padded = hex.length % 2 ? hex + '0' : hex;
    for (let i = 0; i < padded.length; i += 2) {
      const charCode = parseInt(padded.substring(i, i + 2), 16);
      if (charCode >= 32 && charCode < 127) {
        result += String.fromCharCode(charCode);
      } else if (charCode === 10 || charCode === 13) {
        result += '\n';
      }
    }
    return result;
  }

  // ============================================================
  // PDF PAGE COUNT DETECTION
  // ============================================================

  _detectPdfPageCount(rawPdf) {
    const countMatch = rawPdf.match(/\/Type\s*\/Pages[\s\S]{0,200}?\/Count\s+(\d+)/);
    if (countMatch) {
      return parseInt(countMatch[1], 10);
    }

    const pageMatches = rawPdf.match(/\/Type\s*\/Page\b(?!s)/g);
    if (pageMatches) {
      return pageMatches.length;
    }

    return 1;
  }

  // ============================================================
  // PDF METADATA EXTRACTION — Separate from content
  // ============================================================

  _extractPdfMetadata(rawPdf) {
    const metaParts = [];

    const producer = rawPdf.match(/\/Producer\s*\(([^)]*)\)/);
    if (producer) metaParts.push(`Producer: ${this._decodePdfString(producer[1])}`);

    const creator = rawPdf.match(/\/Creator\s*\(([^)]*)\)/);
    if (creator) metaParts.push(`Creator: ${this._decodePdfString(creator[1])}`);

    const author = rawPdf.match(/\/Author\s*\(([^)]*)\)/);
    if (author) metaParts.push(`Author: ${this._decodePdfString(author[1])}`);

    const title = rawPdf.match(/\/Title\s*\(([^)]*)\)/);
    if (title) metaParts.push(`Title: ${this._decodePdfString(title[1])}`);

    const created = rawPdf.match(/\/CreationDate\s*\(([^)]*)\)/);
    if (created) metaParts.push(`CreationDate: ${this._decodePdfString(created[1])}`);

    const modified = rawPdf.match(/\/ModDate\s*\(([^)]*)\)/);
    if (modified) metaParts.push(`ModDate: ${this._decodePdfString(modified[1])}`);

    const xmpMatch = rawPdf.match(/<x:xmpmeta[\s\S]*?<\/x:xmpmeta>/i);
    if (xmpMatch) metaParts.push(`XMP Metadata: [Present, ${xmpMatch[0].length} bytes]`);

    const hasC2pa = /c2pa/i.test(rawPdf) || /content\s*credentials/i.test(rawPdf);
    if (hasC2pa) metaParts.push(`C2PA / Content Credentials: [Present]`);

    const uuids = rawPdf.match(/urn:uuid:[0-9a-f-]{36}/gi);
    if (uuids && uuids.length > 0) metaParts.push(`UUIDs: ${uuids.length} found`);

    return metaParts.join('\n');
  }

  // ============================================================
  // METADATA FILTER — Prevent metadata from becoming content
  // ============================================================

  _filterMetadataFromContent(text) {
    if (!text) return '';

    let cleaned = text;

    for (const pattern of METADATA_PATTERNS) {
      // Reset lastIndex for global regexes before each use
      if (pattern.global) pattern.lastIndex = 0;
      cleaned = cleaned.replace(pattern, ' ');
    }

    cleaned = cleaned
      .replace(/<<[\s\S]{0,500}?>>/g, ' ')
      .replace(/\b\d+\s+\d+\s+R\b/g, ' ')
      .replace(/%PDF-\d+\.\d+/g, ' ')
      .replace(/%%EOF/g, ' ')
      .replace(/\bR\s*>>/g, ' ')
      .replace(/\/\w+/g, ' ');

    cleaned = cleaned
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s{3,}/g, ' ')
      .trim();

    if (cleaned.length > 0) {
      const noiseScore = this._calculateNoiseScore(cleaned);
      if (noiseScore > 0.7) {
        return '';
      }
    }

    return cleaned;
  }

  _calculateNoiseScore(text) {
    if (!text || text.length === 0) return 1.0;

    let noiseCount = 0;
    for (const pattern of NOISE_INDICATORS) {
      if (pattern.global) pattern.lastIndex = 0;
      if (pattern.test(text)) {
        noiseCount++;
      }
    }

    const words = text.match(/[a-zA-Z]{3,}/g) || [];
    const wordChars = words.join('').length;
    const alphaRatio = wordChars / Math.max(text.length, 1);

    if (alphaRatio < 0.3 && noiseCount >= 3) return 0.9;
    if (alphaRatio < 0.4 && noiseCount >= 2) return 0.75;
    if (noiseCount >= 4) return 0.8;

    return noiseCount / Math.max(NOISE_INDICATORS.length, 1);
  }

  // ============================================================
  // READABLE STRING EXTRACTION — Filtered fallback
  // ============================================================

  _extractReadableStrings(rawPdf) {
    const runs = rawPdf.match(/[\x20-\x7E]{10,}/g) || [];

    const meaningful = runs.filter(run => {
      const lower = run.toLowerCase().trim();
      if (/^\s*(obj|endobj|stream|endstream|xref|trailer|startxref)\s*$/.test(lower)) return false;
      if (/^[\d\s.]+$/.test(lower)) return false;
      if (/^\/\w+/.test(lower)) return false;
      if (/^[0-9a-f]{40,}$/i.test(lower.replace(/\s/g, ''))) return false;
      if (!/[a-zA-Z]{2,}/.test(lower)) return false;
      return true;
    });

    return meaningful.join(' ');
  }

  // ============================================================
  // UTILITY METHODS
  // ============================================================

  _normalizeBase64(data) {
    if (!data || typeof data !== 'string') return '';
    let clean = data;
    const commaIdx = clean.indexOf(',');
    if (commaIdx !== -1 && clean.substring(0, commaIdx).includes('base64')) {
      clean = clean.substring(commaIdx + 1);
    }
    clean = clean.replace(/\s+/g, '');
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) {
      return '';
    }
    while (clean.length % 4 !== 0) {
      clean += '=';
    }
    return clean;
  }

  _decodeBase64ToBuffer(data) {
    if (!data) return Buffer.alloc(0);
    if (typeof data !== 'string') return Buffer.from(String(data));

    const clean = this._normalizeBase64(data);
    if (!clean) return Buffer.from(data);

    try {
      return Buffer.from(clean, 'base64');
    } catch {
      return Buffer.from(data);
    }
  }

  _decodeBase64OrText(data) {
    if (!data) return '';
    if (typeof data !== 'string') return String(data);
    
    const clean = this._normalizeBase64(data);
    if (!clean) return data;

    try {
      const buf = Buffer.from(clean, 'base64');
      const utf8 = buf.toString('utf8');
      if (/[\x20-\x7E]{4,}/.test(utf8)) {
        return utf8;
      }
    } catch {}

    return data;
  }
}

export const documentExtractor = new DocumentExtractor();

