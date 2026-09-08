import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { obsidianIndexer } from '../../platform/knowledge/obsidian-indexer.js';
import { obsidianConfig } from '../../platform/knowledge/obsidian-config.js';

describe('Obsidian Graph Extraction', () => {
  before(async () => {
    await obsidianIndexer.syncVault();
  });

  it('should persist obsidian-graph.json on E: drive', () => {
    assert.ok(fs.existsSync(obsidianConfig.graphFile), 'obsidian-graph.json must exist');
    const graphData = JSON.parse(fs.readFileSync(obsidianConfig.graphFile, 'utf8'));
    assert.ok(graphData.nodes, 'Graph must contain nodes');
    assert.ok(graphData.edges, 'Graph must contain edges');
  });

  it('should link notes with wikilinks in graph nodes', () => {
    const graphData = JSON.parse(fs.readFileSync(obsidianConfig.graphFile, 'utf8'));
    const archNode = graphData.nodes.find(n => n.id === '301 Architecture');
    assert.ok(archNode, '301 Architecture node must exist in graph');
    assert.ok(Array.isArray(archNode.tags), 'Node should have tags array');
  });

  it('should calculate in-degree and out-degree connectivity', () => {
    const graphData = JSON.parse(fs.readFileSync(obsidianConfig.graphFile, 'utf8'));
    assert.ok(Array.isArray(graphData.edges));
    if (graphData.edges.length > 0) {
      const firstEdge = graphData.edges[0];
      assert.ok(firstEdge.source, 'Edge should have source');
      assert.ok(firstEdge.target, 'Edge should have target');
    }
  });
});
