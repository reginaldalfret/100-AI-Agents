/**
 * Sovereign AI Workbench — Context Management Policy & Limits
 * Tuned for NVIDIA RTX 2050 (4GB VRAM) & 8GB System RAM
 */

export const ContextPolicy = {
  RECENT_TURNS: 8,                  // Number of recent turns always included in immediate context
  MAX_CONTEXT_TOKENS: 2048,         // Total token budget reserved for context (excluding output tokens)
  MAX_SYSTEM_TOKENS: 512,           // Budget for agent persona & system instructions
  SUMMARY_THRESHOLD: 6,             // Message count threshold to trigger incremental summarization
  MAX_RELEVANT_MESSAGES: 4,         // Max number of non-recent relevant turns retrieved
  REFERENCE_WINDOW: 6,              // Search window (in message turns) for coreference resolution
  ENTITY_LIMIT: 30,                 // Maximum active entities tracked per conversation
  CONFIDENCE_THRESHOLD: 0.65,       // Minimum confidence before clarification is suggested
  TEMPERATURE_DEFAULT: 0.3          // Deterministic temperature for local reasoning
};
