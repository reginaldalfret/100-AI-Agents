/**
 * Sovereign AI Workbench — Conversational Memory & Context Schemas
 */

export const MemoryRetentionMode = {
  SESSION: 'session',
  TASK: 'task',
  LONG_TERM: 'long_term'
};

export const ReferenceType = {
  PRONOUN: 'pronoun',               // it, this, that, these, those, they, them
  ORDINAL: 'ordinal',               // the first one, the second one, the latter, the former
  ARTIFACT: 'artifact',             // that article, that code, that table, the document, the image
  TEMPORAL: 'temporal',             // the previous one, the last response, what you said earlier
  ACTION: 'action',                 // expand it, shorten it, rewrite this, optimize it, continue that
  COMPARATIVE: 'comparative'        // which one, compare that, do the same for X
};

export const ContextConfidenceLevel = {
  HIGH: 0.95,
  MEDIUM: 0.75,
  LOW: 0.50,
  AMBIGUOUS: 0.30
};
