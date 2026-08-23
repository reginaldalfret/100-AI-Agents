import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { 
  documentIngestion, 
  chunker, 
  HybridRetriever, 
  VectorIndex, 
  BM25Index, 
  citationGenerator, 
  evidencePacker 
} from '../../platform/rag/index.js';

describe('RAG Subsystem — 14. Codebase Indexing & Precise Line Citation Test Suite', () => {
  const hybrid = new HybridRetriever({
    vectorIndex: new VectorIndex({ storageDir: 'data/rag/test_codebase_v' }),
    bm25Index: new BM25Index()
  });

  const serverJsPath = path.resolve('platform/gateway/src/server.js');
  const routerJsPath = path.resolve('platform/models/model-router.js');

  test('1. Ingests and chunks real project source files from disk', async () => {
    await hybrid.clear();

    const serverDoc = await documentIngestion.ingestFile(serverJsPath);
    const routerDoc = await documentIngestion.ingestFile(routerJsPath);

    assert.strictEqual(serverDoc.fileType, 'js');
    assert.strictEqual(routerDoc.fileType, 'js');
    assert.ok(serverDoc.codeSymbols.length > 0, 'Server.js code symbols found');
    assert.ok(routerDoc.codeSymbols.length > 0, 'Model-router.js code symbols found');

    const serverChunks = chunker.chunkDocument(serverDoc);
    const routerChunks = chunker.chunkDocument(routerDoc);

    assert.ok(serverChunks.length > 0);
    assert.ok(routerChunks.length > 0);

    const indexedServer = await hybrid.addChunks(serverChunks);
    const indexedRouter = await hybrid.addChunks(routerChunks);

    assert.ok(indexedServer > 0);
    assert.ok(indexedRouter > 0);
  });

  test('2. Retrieves model-router dispatch logic with exact function line citation', () => {
    const query = 'routeTaskToLocalModel dispatch local model inference';
    const results = hybrid.search(query, { topK: 3 });

    assert.ok(results.length > 0);
    const topMatch = results.find(r => r.filename.includes('model-router.js'));
    assert.ok(topMatch, 'Found model-router match');

    const citations = citationGenerator.generateCitations([topMatch]);
    assert.strictEqual(citations.length, 1);

    const cit = citations[0];
    assert.strictEqual(cit.citationType, 'code');
    assert.strictEqual(cit.filename, 'model-router.js');
    assert.ok(cit.codeRange);
    assert.strictEqual(cit.codeRange.startLine, 13);
    assert.ok(cit.codeRange.endLine >= 40);
    assert.strictEqual(cit.codeRange.symbol, 'routeTaskToLocalModel');
    assert.ok(cit.citationText.includes('model-router.js:L13-L'));
  });

  test('3. Retrieves gateway server execution & fallback logic with line bounds', () => {
    const query = 'requestAgent executeAgentInProcess fallback execution';
    const results = hybrid.search(query, { topK: 5 });

    assert.ok(results.length > 0);
    const serverMatch = results.find(r => r.filename.includes('server.js'));
    assert.ok(serverMatch, 'Found server.js match');

    const citations = citationGenerator.generateCitations([serverMatch]);
    assert.strictEqual(citations.length, 1);
    assert.strictEqual(citations[0].citationType, 'code');
    assert.ok(citations[0].codeRange.startLine > 0);
    assert.ok(citations[0].codeRange.endLine >= citations[0].codeRange.startLine);
  });

  test('4. Packages codebase evidence into secure <source_evidence> envelope', () => {
    const query = 'routeTaskToLocalModel evaluateSovereignEgress';
    const results = hybrid.search(query, { topK: 2 });
    assert.ok(results.length > 0);

    const pack = evidencePacker.buildEvidencePack(results);
    assert.ok(pack.evidencePack.includes('<source_evidence>'));
    assert.ok(pack.evidencePack.includes('source="model-router.js"'));
    assert.ok(pack.evidencePack.includes('type="code"'));
    assert.ok(pack.evidencePack.includes('lines="13-'));
    assert.ok(pack.evidencePack.endsWith('</source_evidence>'));
  });
});
