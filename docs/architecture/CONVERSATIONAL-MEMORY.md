# Multi-Turn Conversational Memory & Context Management Architecture

**Platform:** Sovereign AI Workbench  
**Project:** 101 Super AI Agents  
**Runtime:** 100% Local / On-Premise Air-Gapped (NVIDIA RTX 2050 4GB)

---

## 1. Overview & Architecture

The Conversational Memory Subsystem delivers production-grade multi-turn context retention, coreference/anaphora resolution, and semantic topic tracking across all 101 AI agents and all 3 local open-weight models (Nemotron 3 Nano, Gemma 3 4B, and Qwen 2.5 Coder).

```
USER MESSAGE ("write about the types in it")
    ↓
1. Conversation Identification & Isolation (conversation-manager.js)
    ↓
2. Deterministic Coreference Resolution (reference-resolver.js)
   ("it" → "Renewable Energy", "the second one" → "Wind Energy")
    ↓
3. Entity & Topic State Tracking (entity-memory.js + topic-memory.js)
    ↓
4. Contextual Relevance & Summary Assembly (relevance-retriever.js + conversation-summarizer.js)
    ↓
5. Context Window & Token Budgeting (context-window.js + context-policy.js)
    ↓
6. Context-Enriched Prompt Construction (context-builder.js)
    ↓
7. Local Model Execution & True Token Streaming (NDJSON → SSE)
    ↓
8. Post-Turn Memory Update & Safe Persistence (data/conversations/*.json)
```

---

## 2. Core Modules

| Module | Responsibility |
|---|---|
| `conversation-manager.js` | Coordinates context preparation, turn recording, memory hydration, and disk persistence. |
| `reference-resolver.js` | Resolves pronouns (`it`, `this`, `that`), ordinals (`the first one`, `the second one`), and directives (`make it shorter`). |
| `entity-memory.js` | Tracks named equipment tags (`HX-204`), technologies (`React`, `Python`), concepts, and list items. |
| `topic-memory.js` | Tracks active topic, subtopics, intent, and topic transition history. |
| `conversation-summarizer.js` | Maintains compact extractive summaries for conversations exceeding 6 turns. |
| `relevance-retriever.js` | Semantically retrieves relevant non-recent turns based on entity/keyword overlap. |
| `context-window.js` | Binds token limits (2,048 tokens context budget) without truncating user queries. |
| `context-builder.js` | Formulates final multi-turn messages and prompt packages for Ollama. |

---

## 3. Privacy & Zero-Egress Invariants

- **0 External Network Calls**: All memory indexing and resolution runs in local memory and storage.
- **Session Isolation**: Conversation A memory is completely isolated from Conversation B memory.
- **Hardware Safe**: Resolution is deterministic (< 5ms latency) without spawning redundant LLM calls on the RTX 2050.
