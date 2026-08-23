/**
 * Sovereign AI Workbench — Speech Text Sanitizer & Conversational Normalizer
 * Cleans markdown, code fences, ASCII tables, and technical symbols into natural spoken prose.
 */

export class SpeechSanitizer {
  /**
   * Sanitizes AI response text into conversational prose suitable for TTS speech synthesis.
   * @param {string} rawText
   * @returns {string} spokenText
   */
  sanitizeForSpeech(rawText) {
    if (!rawText || typeof rawText !== 'string') return '';

    let text = rawText.trim();

    // 1. Replace multi-line code fences with a conversational summary
    text = text.replace(/```[\s\S]*?```/g, " I have generated the code on screen for your review. ");

    // 2. Replace inline code tags `foo()` with plain text foo
    text = text.replace(/`([^`]+)`/g, '$1');

    // 3. Replace markdown tables with conversational summary
    text = text.replace(/\|[\s\S]*?\|\n\|[-:\s|]+\|\n([\s\S]*?)(?=\n\n|$)/g, " The data table is displayed on screen. ");

    // 4. Strip UI metadata / tags / icons
    text = text.replace(/⚡\s*[^\n]+/g, '');
    text = text.replace(/●\s*[^\n]+/g, '');
    text = text.replace(/\[ATTACHED EVIDENCE:[^\]]+\]/gi, '');
    text = text.replace(/\b(AUDIT ID|TRACE ID|EXECUTION TRACE|0 EXTERNAL CALLS)\b[^\n]*/gi, '');

    // 5. Clean Markdown formatting: headers, bold, italics, links, blockquotes
    text = text.replace(/^#{1,6}\s+/gm, ''); // # Heading
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1'); // **bold**
    text = text.replace(/\*([^*]+)\*/g, '$1'); // *italic*
    text = text.replace(/__([^_]+)__/g, '$1');
    text = text.replace(/_([^_]+)_/g, '$1');
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // [text](url) -> text
    text = text.replace(/^>\s+/gm, ''); // blockquotes

    // 6. Format lists cleanly for natural speech
    text = text.replace(/^[\*\-•]\s+/gm, ' ');
    text = text.replace(/^\d+\.\s+/gm, ' ');

    // 7. Clean up punctuation and spacing
    text = text.replace(/[\r\n]+/g, ' ');
    text = text.replace(/\s{2,}/g, ' ');

    return text.trim();
  }

  /**
   * Splits a stream of text into ready-to-speak sentence chunks.
   * @param {string} text
   * @returns {Array<string>} sentences
   */
  chunkIntoSentences(text) {
    if (!text) return [];
    const sanitized = this.sanitizeForSpeech(text);
    // Split on sentence-ending punctuation followed by space or end
    const sentences = sanitized.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [];
    return sentences.map(s => s.trim()).filter(s => s.length > 0);
  }
}

export const speechSanitizer = new SpeechSanitizer();
