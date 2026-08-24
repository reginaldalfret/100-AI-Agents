/**
 * Sovereign AI Workbench — Canonical Stream Sanitizer
 * Real-time streaming state machine for suppressing model internal reasoning
 * (e.g. DeepSeek-R1 <think>...</think>) while preserving true token-by-token streaming.
 */

export const SanitizerState = {
  ANSWER: 'ANSWER',
  THINKING: 'THINKING'
};

const THINK_START_TAG = '<think>';
const THINK_END_TAG = '</think>';

export class StreamSanitizer {
  constructor(options = {}) {
    this.state = SanitizerState.ANSWER;
    this.startTag = options.startTag || THINK_START_TAG;
    this.endTag = options.endTag || THINK_END_TAG;
    this.customTags = options.customTags || [
      { start: '<think>', end: '</think>' },
      { start: '<reasoning>', end: '</reasoning>' },
      { start: '[THINK]', end: '[/THINK]' },
      { start: '[REASONING]', end: '[/REASONING]' }
    ];
    
    this.pendingBuffer = '';
    this.accumulatedVisibleText = '';
    this.accumulatedHiddenReasoning = '';
    this.hasEmittedTokens = false;
  }

  /**
   * Reset sanitizer state between stream runs.
   */
  reset() {
    this.state = SanitizerState.ANSWER;
    this.pendingBuffer = '';
    this.accumulatedVisibleText = '';
    this.accumulatedHiddenReasoning = '';
    this.hasEmittedTokens = false;
  }

  /**
   * Process a single incoming streaming chunk / token.
   * Returns the sanitized visible text to emit immediately.
   */
  push(chunk) {
    if (!chunk || typeof chunk !== 'string') {
      return '';
    }

    let toProcess = this.pendingBuffer + chunk;
    this.pendingBuffer = '';
    let output = '';

    while (toProcess.length > 0) {
      if (this.state === SanitizerState.ANSWER) {
        let earliestMatch = null;
        for (const tagPair of this.customTags) {
          const startTag = tagPair.start;
          const idx = toProcess.indexOf(startTag);
          if (idx !== -1) {
            if (earliestMatch === null || idx < earliestMatch.idx) {
              earliestMatch = { idx, tag: startTag, endTag: tagPair.end };
            }
          }
        }

        if (earliestMatch !== null) {
          const textBefore = toProcess.slice(0, earliestMatch.idx);
          output += textBefore;
          this.accumulatedVisibleText += textBefore;

          this.state = SanitizerState.THINKING;
          this.currentEndTag = earliestMatch.endTag;
          toProcess = toProcess.slice(earliestMatch.idx + earliestMatch.tag.length);
        } else {
          let longestPrefixLen = 0;
          for (const tagPair of this.customTags) {
            const startTag = tagPair.start;
            for (let i = 1; i < startTag.length; i++) {
              const prefix = startTag.slice(0, i);
              if (toProcess.endsWith(prefix)) {
                if (prefix.length > longestPrefixLen) {
                  longestPrefixLen = prefix.length;
                }
              }
            }
          }

          if (longestPrefixLen > 0) {
            const safeText = toProcess.slice(0, toProcess.length - longestPrefixLen);
            this.pendingBuffer = toProcess.slice(toProcess.length - longestPrefixLen);
            output += safeText;
            this.accumulatedVisibleText += safeText;
            toProcess = '';
          } else {
            output += toProcess;
            this.accumulatedVisibleText += toProcess;
            toProcess = '';
          }
        }
      } else if (this.state === SanitizerState.THINKING) {
        const endTag = this.currentEndTag || this.endTag;
        const endIdx = toProcess.indexOf(endTag);

        if (endIdx !== -1) {
          const hiddenSegment = toProcess.slice(0, endIdx);
          this.accumulatedHiddenReasoning += hiddenSegment;

          this.state = SanitizerState.ANSWER;
          this.currentEndTag = null;
          toProcess = toProcess.slice(endIdx + endTag.length);
        } else {
          let longestPrefixLen = 0;
          for (let i = 1; i < endTag.length; i++) {
            const prefix = endTag.slice(0, i);
            if (toProcess.endsWith(prefix)) {
              if (prefix.length > longestPrefixLen) {
                longestPrefixLen = prefix.length;
              }
            }
          }

          if (longestPrefixLen > 0) {
            const hiddenSegment = toProcess.slice(0, toProcess.length - longestPrefixLen);
            this.accumulatedHiddenReasoning += hiddenSegment;
            this.pendingBuffer = toProcess.slice(toProcess.length - longestPrefixLen);
            toProcess = '';
          } else {
            this.accumulatedHiddenReasoning += toProcess;
            toProcess = '';
          }
        }
      }
    }

    if (output) {
      this.hasEmittedTokens = true;
    }
    return output;
  }

  /**
   * Finalize the stream. Flushes any remaining pending buffer if in ANSWER state.
   */
  flush() {
    let finalChunk = '';
    if (this.state === SanitizerState.ANSWER && this.pendingBuffer) {
      finalChunk = this.pendingBuffer;
      this.accumulatedVisibleText += this.pendingBuffer;
      this.pendingBuffer = '';
    } else if (this.state === SanitizerState.THINKING) {
      this.accumulatedHiddenReasoning += this.pendingBuffer;
      this.pendingBuffer = '';
    }
    return finalChunk;
  }

  /**
   * Get the complete visible accumulated text.
   */
  getVisibleText() {
    return this.accumulatedVisibleText;
  }

  /**
   * Get the complete hidden reasoning text.
   */
  getHiddenReasoning() {
    return this.accumulatedHiddenReasoning;
  }

  /**
   * Static helper for non-streaming full text sanitization.
   */
  static sanitizeFullText(text) {
    if (!text || typeof text !== 'string') return '';
    const sanitizer = new StreamSanitizer();
    const clean = sanitizer.push(text) + sanitizer.flush();
    return clean.trim();
  }
}
