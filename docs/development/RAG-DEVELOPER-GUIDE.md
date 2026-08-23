# Sovereign Local Hybrid RAG — Developer Guide

## 1. Quick Start Guide

The Sovereign Local Hybrid RAG engine is exposed via a unified ES module at `platform/rag/index.js`. All operations are asynchronous, air-gapped, and require zero external configuration.

### 1.1 Ingesting a Document
```javascript
import { ingestDocument } from '../platform/rag/index.js';

// Ingest from disk path (PDF, DOCX, XLSX, CSV, Code, MD)
const result = await ingestDocument('docs/refinery/api-653-manual.pdf', {
  namespace: 'GLOBAL',
  tags: ['refinery', 'inspection', 'api-653'],
  customMetadata: { plantUnit: 'Atmospheric Distillation Unit 1' }
});

console.log(`Document Ingested: ${result.documentId}, Chunks: ${result.chunksIndexed}`);
```

### 1.2 Querying Knowledge Base
```javascript
import { searchKnowledge } from '../platform/rag/index.js';

const searchResponse = await searchKnowledge('What is the minimum shell thickness formula for tank TK-101?', {
  namespace: 'GLOBAL',
  topK: 4,
  maxBudgetTokens: 2000,
  context: {
    activeTopic: 'Tank TK-101 Inspection',
    recentMessages: [
      { role: 'user', content: 'Let us check storage tank TK-101' }
    ]
  }
});

console.log('Citations:', searchResponse.citations);
console.log('Grounding Evidence:\n', searchResponse.evidencePrompt);
```

### 1.3 Ingesting Gemma 3 Multimodal Vision Observations
```javascript
import { ingestDocument } from '../platform/rag/index.js';

const observationPayload = {
  filename: 'tank_shell_ultrasonic_scan.png',
  caption: 'Ultrasonic thickness scan diagram of storage tank TK-101 shell plate',
  observations: [
    'Critical localized wall thinning detected on course 2.',
    'Measured remaining thickness is 4.8mm compared to nominal 8.0mm.',
    'Corrosion rate is approximately 0.45mm/year.'
  ],
  ocrText: 'POINT_ID: P-042 | THK_MM: 4.80 | STAT: ALERT_CUI',
  dimensions: { width: 1920, height: 1080 }
};

await ingestDocument(observationPayload, {
  namespace: 'ATTACHMENT',
  tags: ['cui', 'ultrasonic', 'tk-101']
});
```

---

## 2. API Reference

### 2.1 `RAGService` (`ragService`)

| Method | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `ingestDocument(input, options)` | `input: string\|Buffer\|Object`, `options: Object` | `Promise<Object>` | Ingests, normalizes, chunks, embeds, and indexes document in Vector + BM25 stores. |
| `searchKnowledge(query, options)` | `query: string`, `options: Object` | `Promise<Object>` | Evaluates query necessity, resolves coreferences, runs hybrid search, and packs evidence. |
| `deleteDocument(documentId, ns)` | `documentId: string`, `namespace: string` | `Promise<Object>` | Removes document and all its chunks from both Vector and BM25 persistent stores. |
| `indexCodebase(options)` | `options: Object` | `Promise<Object>` | Recursively indexes workspace code, contracts, and documentation into `PROJECT` namespace. |
| `getStats()` | None | `Object` | Returns aggregated metrics across memory, storage, and indices. |

---

### 2.2 Options & Parameter Reference

#### `searchKnowledge(query, options)` Options:
- `namespace` (`string`, default: `null` for all namespaces): Target partition (`GLOBAL`, `PROJECT`, `AGENT`, `CONVERSATION`, `ATTACHMENT`).
- `topK` (`number`, default: `5`): Maximum chunks to return.
- `maxBudgetTokens` (`number`, default: `2500`): Maximum token budget for packed evidence.
- `mode` (`'RRF'` | `'WEIGHTED'`, default: `'RRF'`): Fusion algorithm.
- `adaptiveTopK` (`boolean`, default: `true`): Enable drop-off pruning of low-relevance results.
- `context` (`Object`, optional): Conversation context `{ activeTopic, subtopic, recentMessages, entities, replyTo }`.
- `forceRetrieve` (`boolean`, default: `false`): Force retrieval even if query is flagged as greeting/trivial.

---

### 2.3 Individual Component Access

For specialized pipelines, individual subsystem components can be imported directly:

```javascript
import {
  DocumentIngestion,
  Chunker,
  EmbeddingEngine,
  VectorIndex,
  BM25Engine,
  HybridRetriever,
  QueryRewriter,
  EvidencePack,
  CodebaseIndexer
} from '../platform/rag/index.js';
```

---

## 3. Developing Custom Agent Grounding Hooks

To integrate hybrid RAG into a new sovereign agent:

```javascript
import { searchKnowledge } from '../../platform/rag/index.js';

export class TechnicalInspectionAgent {
  async execute(userMessage, conversationContext) {
    // 1. Fetch grounded evidence
    const ragResult = await searchKnowledge(userMessage, {
      namespace: 'GLOBAL',
      context: conversationContext,
      topK: 3
    });

    // 2. Build prompt with evidence injection defense
    const systemPrompt = `You are a Senior Industrial Inspection AI. Ground your answers strictly in the verified source evidence below.\n\n${ragResult.evidencePrompt}`;

    // 3. Dispatch to local LLM (Gemma 3 / Nemotron)
    const response = await this.llm.generate({
      system: systemPrompt,
      prompt: userMessage
    });

    return {
      text: response,
      citations: ragResult.citations
    };
  }
}
```
