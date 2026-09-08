import { describe, it } from 'node:test';
import assert from 'node:assert';
import { sourceRegistry, KnowledgeSourceType } from '../../platform/knowledge/source-registry.js';

describe('Canonical Multi-Source Knowledge Registry', () => {
  it('should initialize with standard source categories', () => {
    const sources = sourceRegistry.getAllSources();
    assert.ok(Array.isArray(sources));
    assert.ok(sources.some(s => s.type === KnowledgeSourceType.OBSIDIAN));
    assert.ok(sources.some(s => s.type === KnowledgeSourceType.DOCUMENTS));
    assert.ok(sources.some(s => s.type === KnowledgeSourceType.DATASETS));
    assert.ok(sources.some(s => s.type === KnowledgeSourceType.CODEBASE));
  });

  it('should retrieve individual source by ID', () => {
    const obs = sourceRegistry.getSource('source-obsidian-vault');
    assert.ok(obs, 'Obsidian source must be present');
    assert.strictEqual(obs.type, KnowledgeSourceType.OBSIDIAN);
    assert.strictEqual(obs.enabled, true);
  });

  it('should return system-wide knowledge statistics', () => {
    const stats = sourceRegistry.getSystemStats();
    assert.ok(stats.totalSources >= 4);
    assert.strictEqual(stats.isAirGapped, true);
    assert.strictEqual(stats.externalCalls, 0);
  });
});
