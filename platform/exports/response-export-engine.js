/**
 * Sovereign AI Workbench — Response Export Engine
 * 
 * Local, air-gapped generation of PDF, XLSX, and CSV exports from AI responses.
 * 0 External API Calls · 100% On-Premise CPU Generation · True Content Preservation
 */

import { spawn } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../');
const PYTHON_BACKEND = path.join(__dirname, 'exporter_backend.py');
const ARTIFACTS_EXPORT_DIR = path.join(REPO_ROOT, 'platform/artifacts/exports');

if (!fs.existsSync(ARTIFACTS_EXPORT_DIR)) {
  fs.mkdirSync(ARTIFACTS_EXPORT_DIR, { recursive: true });
}

export class ResponseExportEngine {
  constructor() {
    this.supportedFormats = ['pdf', 'xlsx', 'excel', 'csv'];
    this.mimeTypes = {
      pdf: 'application/pdf',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv; charset=utf-8'
    };
  }

  /**
   * Generates a clean, sanitized Windows-compatible filename based on title and format.
   * @param {string} title
   * @param {string} format
   * @returns {string} e.g. 'palindrome-program.pdf'
   */
  generateFilename(title, format) {
    const ext = format.toLowerCase() === 'excel' ? 'xlsx' : format.toLowerCase();
    let slug = (title || 'response')
      .toLowerCase()
      .replace(/[''""]/g, '')
      .replace(/[^a-z0-9\s-]/g, ' ')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (!slug) slug = 'ai-response';
    if (slug.length > 50) slug = slug.substring(0, 50).replace(/-$/, '');
    return `${slug}.${ext}`;
  }

  /**
   * Exports a response to PDF, XLSX, or CSV.
   * @param {object} params
   * @param {string} params.content - Raw markdown response text
   * @param {string} [params.title] - Document title / conversation title
   * @param {string} [params.format='pdf'] - 'pdf' | 'xlsx' | 'csv'
   * @param {string} [params.conversationId]
   * @param {string} [params.messageId]
   * @returns {Promise<{ buffer: Buffer, filename: string, mimeType: string, sizeBytes: number, sha256: string, artifactId: string }>}
   */
  async exportResponse({ content, title = 'AI Response', format = 'pdf', conversationId, messageId }) {
    if (!content || typeof content !== 'string' || !content.trim()) {
      throw new Error('EXPORT_VALIDATION_FAILED: Response content is empty or invalid.');
    }

    const fmt = (format || 'pdf').toLowerCase().trim();
    if (!this.supportedFormats.includes(fmt)) {
      throw new Error(`EXPORT_FORMAT_UNSUPPORTED: Format '${fmt}' is not supported. Use 'pdf', 'xlsx', or 'csv'.`);
    }

    const normFmt = fmt === 'excel' ? 'xlsx' : fmt;
    const filename = this.generateFilename(title, normFmt);
    const artifactId = `export_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const tempOutFile = path.join(os.tmpdir(), `${artifactId}.${normFmt}`);
    const persistentFile = path.join(ARTIFACTS_EXPORT_DIR, `${artifactId}_${filename}`);

    const payload = JSON.stringify({
      title: title || 'AI Response',
      content: content,
      format: normFmt,
      out_path: tempOutFile
    });

    try {
      const pyRes = await new Promise((resolve, reject) => {
        const pyProc = spawn('py', ['-3.12', PYTHON_BACKEND], {
          windowsHide: true,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        pyProc.stdout.on('data', (d) => { stdout += d.toString(); });
        pyProc.stderr.on('data', (d) => { stderr += d.toString(); });

        pyProc.on('close', (code) => {
          if (code !== 0) {
            return reject(new Error(`${normFmt.toUpperCase()}_EXPORT_FAILED: Python process exited with code ${code}. ${stderr}`));
          }
          try {
            const res = JSON.parse(stdout.trim());
            if (res.status !== 'success') {
              return reject(new Error(`${normFmt.toUpperCase()}_EXPORT_FAILED: ${res.error || 'Unknown export error'}`));
            }
            resolve(res);
          } catch (e) {
            reject(new Error(`${normFmt.toUpperCase()}_EXPORT_FAILED: Failed to parse exporter output: ${stdout} ${stderr}`));
          }
        });

        pyProc.stdin.write(payload);
        pyProc.stdin.end();
      });

      if (!fs.existsSync(tempOutFile)) {
        throw new Error(`${normFmt.toUpperCase()}_EXPORT_FAILED: Output file was not generated.`);
      }

      const fileBuffer = fs.readFileSync(tempOutFile);
      const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // Persist to artifact store
      fs.copyFileSync(tempOutFile, persistentFile);

      return {
        buffer: fileBuffer,
        filename,
        mimeType: this.mimeTypes[normFmt] || 'application/octet-stream',
        sizeBytes: fileBuffer.length,
        sha256,
        artifactId,
        filePath: persistentFile
      };
    } finally {
      if (fs.existsSync(tempOutFile)) {
        try { fs.unlinkSync(tempOutFile); } catch {}
      }
    }
  }
}

export const globalResponseExportEngine = new ResponseExportEngine();
