# Sovereign Local Hybrid RAG — Operations & Maintenance Manual

## 1. Storage Layout & Persistence Architecture

The Sovereign Hybrid RAG subsystem maintains atomic persistence across disk directories under `data/rag/`:

```
E:/Smart Automation/100-AI-Agents/data/rag/
├── vectors/
│   ├── index_GLOBAL.json          # Dense vectors & metadata for GLOBAL namespace
│   ├── index_PROJECT.json         # Dense vectors for repository codebase
│   └── index_ATTACHMENT.json      # Temporary upload vectors
├── bm25/
│   ├── bm25_GLOBAL.json           # Okapi BM25 inverted index for GLOBAL namespace
│   ├── bm25_PROJECT.json          # Okapi BM25 inverted index for codebase
│   └── bm25_ATTACHMENT.json       # Okapi BM25 inverted index for attachments
└── cache/
    └── embeddings_sovereign-dense-384-v1.json  # RAM/Disk embedding vector cache
```

### 1.1 Atomic Persistence Guarantee
- All disk write operations use the **Atomic Rename Protocol**:
  1. Write payload to a temporary file (`index_GLOBAL.tmp`).
  2. Perform `fs.renameSync` / `fsp.rename` to replace the target file atomically.
- This guarantees zero corrupted or partial index files during unexpected power loss or process restarts.

---

## 2. Memory & Compute Resource Governance

| Subsystem Component | Typical Memory Footprint | CPU Load Profile | Storage Consumption |
| :--- | :--- | :--- | :--- |
| **Embedding Engine** | ~15 MB for 20,000 cached vectors | Spikes during batch ingestion (<1ms/chunk) | ~30 MB on disk |
| **Vector Index** | ~2.5 MB per 1,000 chunks | <5ms per search query (unrolled SIMD loop) | ~1.8 MB per 1,000 chunks |
| **BM25 Engine** | ~3.0 MB per 1,000 chunks | <2ms per search query (inverted map lookup) | ~2.2 MB per 1,000 chunks |
| **Hybrid Retrieval Total** | **<50 MB base RAM** | **<8ms end-to-end retrieval latency** | **<100 MB for 20k chunks** |

---

## 3. Operations & Maintenance Procedures

### 3.1 Initial System Warm-up & Codebase Indexing
To index the entire workspace repository for Agent 101:

```javascript
import { ingestCodebase, getStats } from './platform/rag/index.js';

console.log('Starting full codebase index...');
const report = await ingestCodebase({
  targetDirs: ['platform', 'agents', 'docs', 'agent-contract'],
  targetFiles: ['README.md', 'package.json'],
  forceReindex: false
});

console.log(`Indexed ${report.indexedFiles} files, ${report.indexedChunks} chunks in ${report.durationMs}ms.`);
```

### 3.2 Index Backup & Restore
- **Backup**: Copy the entire directory `data/rag/` to backup media or cold storage.
  ```powershell
  Copy-Item -Path "data/rag" -Destination "archive/rag_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')" -Recurse
  ```
- **Restore**: Stop any active workbench agents and copy back the snapshot to `data/rag/`.

### 3.3 Cache Eviction & Cleanup
If storage space needs reclamation:
1. Temporary namespaces (`ATTACHMENT`, `CONVERSATION`) can be purged at any time:
   ```javascript
   import { ragService } from './platform/rag/index.js';
   await ragService.vectorIndex.clear('ATTACHMENT');
   await ragService.bm25Engine.clear('ATTACHMENT');
   ```

---

## 4. Troubleshooting Guide

| Symptom | Probable Root Cause | Resolution Action |
| :--- | :--- | :--- |
| **Zero results returned for obvious keyword** | Namespace mismatch or query was classified as greeting. | Check `searchKnowledge(query, { namespace: 'GLOBAL', forceRetrieve: true })`. |
| **Out-of-memory error during large PDF ingestion** | Document exceeds 50MB single-file limit. | Adjust `maxFileSizeBytes` or split document into chapters before ingestion. |
| **Slow retrieval (>50ms)** | Disk cache miss or excessively large candidate retrieval pool. | Verify cache file exists in `data/rag/cache/` and set `topK: 5`. |
| **Corrupted JSON file in `data/rag/`** | Abrupt process termination during disk sync. | Delete the corrupted `index_*.json` file and trigger re-indexing. |
