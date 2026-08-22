/**
 * Sovereign AI Workbench — Universal Multimodal Document & File Extractor
 * Parses text, PDFs, CSVs, JSON, code, tables, and images locally with zero external calls.
 */

import path from 'node:path';

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
    let tables = [];
    let isMultimodalImage = false;
    let base64Image = null;
    let docType = 'text';

    // 1. Image Formats -> Pass to Gemma 3 Vision
    if (mimeType.startsWith('image/') || /\.(png|jpe?g|webp|bmp|gif|tiff)$/i.test(filename)) {
      isMultimodalImage = true;
      base64Image = rawData.includes(',') ? rawData.split(',')[1] : rawData;
      docType = 'image';
      extractedText = `[Image Attached: ${filename} (Visual Analysis by Google Gemma 3 Vision Engine)]`;
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
      } else {
        extractedText = textContent;
      }
    }

    // 3. JSON / Code / Text files
    else if (['.txt', '.md', '.json', '.yaml', '.yml', '.xml', '.html', '.js', '.py', '.sql', '.css', '.c', '.cpp', '.rs', '.go'].includes(ext)) {
      docType = 'code_or_text';
      extractedText = this._decodeBase64OrText(rawData);
    }

    // 4. PDF Documents
    else if (ext === '.pdf' || mimeType.includes('pdf')) {
      docType = 'pdf';
      const rawDecoded = this._decodeBase64OrText(rawData);
      
      // Extract text streams and readable chunks from PDF
      const textMatches = rawDecoded.match(/\(([^()]+)\)\s*Tj/g) || [];
      if (textMatches.length > 0) {
        extractedText = textMatches.map(m => m.replace(/\(|\)\s*Tj/g, '')).join(' ');
      }
      
      if (!extractedText || extractedText.length < 20) {
        // Structured fallback for industrial/technical PDF reports
        extractedText = `[Extracted Content from PDF: ${filename}]\n${rawDecoded.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s{3,}/g, ' ')}`;
      }
    }

    // 5. DOCX / XLSX / Binary Documents
    else {
      docType = 'document';
      const rawDecoded = this._decodeBase64OrText(rawData);
      extractedText = rawDecoded.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s{3,}/g, ' ').slice(0, 4000);
      if (!extractedText.trim()) {
        extractedText = `[Attached Document: ${filename}]`;
      }
    }

    return {
      filename,
      extension: ext,
      docType,
      size: attachment.size || rawData.length,
      extractedText: extractedText.trim(),
      tables,
      isMultimodalImage,
      base64Image
    };
  }

  _decodeBase64OrText(data) {
    if (!data) return '';
    if (typeof data !== 'string') return String(data);
    
    // If it's a data URL, strip prefix
    let clean = data;
    if (clean.includes(',')) {
      clean = clean.split(',')[1];
    }

    // Attempt base64 decode
    try {
      const buf = Buffer.from(clean, 'base64');
      const utf8 = buf.toString('utf8');
      // If it has valid characters, return it
      if (/[\x20-\x7E]{4,}/.test(utf8)) {
        return utf8;
      }
    } catch {}

    return data;
  }
}

export const documentExtractor = new DocumentExtractor();
