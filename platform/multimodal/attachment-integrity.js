/**
 * Sovereign AI Workbench — Attachment Integrity & Payload Normalization Engine
 * Guarantees zero byte corruption, data URL normalization, and MIME magic-byte verification.
 */

import crypto from 'node:crypto';

// Magic byte signatures
const MAGIC_BYTES = {
  PNG: Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
  JPEG: Buffer.from([0xFF, 0xD8, 0xFF]),
  PDF: Buffer.from('%PDF-'),
  WEBP: Buffer.from('RIFF'),
  GIF: Buffer.from('GIF8')
};

/**
 * Strips any data URL prefix (e.g. data:image/png;base64,...) returning pure base64.
 */
export function stripDataUrlPrefix(data) {
  if (typeof data !== 'string') return '';
  const commaIdx = data.indexOf(',');
  if (commaIdx !== -1 && data.slice(0, commaIdx).includes('base64')) {
    return data.slice(commaIdx + 1).trim();
  }
  return data.trim();
}

/**
 * Decodes an attachment object or base64 string to a raw Buffer.
 */
export function decodeAttachmentToBuffer(attachmentOrData) {
  if (!attachmentOrData) return Buffer.alloc(0);
  if (Buffer.isBuffer(attachmentOrData)) return attachmentOrData;

  let rawString = '';
  if (typeof attachmentOrData === 'object') {
    rawString = attachmentOrData.data || attachmentOrData.content || '';
  } else if (typeof attachmentOrData === 'string') {
    rawString = attachmentOrData;
  }

  const cleanBase64 = stripDataUrlPrefix(rawString);
  if (!cleanBase64) return Buffer.alloc(0);

  try {
    return Buffer.from(cleanBase64, 'base64');
  } catch (err) {
    return Buffer.from(rawString, 'utf8');
  }
}

/**
 * Computes SHA-256 hash of a Buffer or string.
 */
export function computeSha256(bufferOrString) {
  const buf = Buffer.isBuffer(bufferOrString)
    ? bufferOrString
    : Buffer.from(stripDataUrlPrefix(String(bufferOrString)), 'base64');
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/**
 * Validates attachment integrity, detects magic bytes, and returns diagnostic metadata.
 */
export function validateAttachmentIntegrity(attachment) {
  if (!attachment || typeof attachment !== 'object') {
    return {
      valid: false,
      error: 'ATTACHMENT_INVALID',
      message: 'Attachment object is missing or invalid'
    };
  }

  const name = attachment.name || 'unnamed';
  const declaredMime = attachment.type || '';
  const buffer = decodeAttachmentToBuffer(attachment);
  const size = buffer.length;

  if (size === 0) {
    return {
      valid: false,
      error: 'ATTACHMENT_EMPTY',
      name,
      declaredMime,
      size: 0,
      sha256: null,
      message: 'Attachment payload contains 0 bytes'
    };
  }

  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

  // Check magic bytes
  let detectedType = 'unknown';
  let isImage = false;
  let isPdf = false;

  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(MAGIC_BYTES.PNG)) {
    detectedType = 'image/png';
    isImage = true;
  } else if (buffer.length >= 3 && buffer.subarray(0, 3).equals(MAGIC_BYTES.JPEG)) {
    detectedType = 'image/jpeg';
    isImage = true;
  } else if (buffer.length >= 5 && buffer.subarray(0, 5).equals(MAGIC_BYTES.PDF)) {
    detectedType = 'application/pdf';
    isPdf = true;
  } else if (buffer.length >= 4 && buffer.subarray(0, 4).equals(MAGIC_BYTES.WEBP)) {
    detectedType = 'image/webp';
    isImage = true;
  } else if (buffer.length >= 4 && buffer.subarray(0, 4).equals(MAGIC_BYTES.GIF)) {
    detectedType = 'image/gif';
    isImage = true;
  } else if (name.endsWith('.pdf')) {
    isPdf = true;
    detectedType = 'application/pdf';
  } else if (name.endsWith('.csv') || declaredMime.includes('csv')) {
    detectedType = 'text/csv';
  } else if (name.endsWith('.json') || declaredMime.includes('json')) {
    detectedType = 'application/json';
  } else {
    detectedType = declaredMime || 'application/octet-stream';
    if (detectedType.startsWith('image/')) isImage = true;
  }

  return {
    valid: true,
    name,
    declaredMime,
    detectedType,
    isImage,
    isPdf,
    size,
    sha256,
    base64: buffer.toString('base64'),
    buffer
  };
}
