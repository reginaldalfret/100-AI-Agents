/**
 * Sovereign AI Workbench — Canonical Knowledge Source Registry
 * Tracks and orchestrates multi-modal knowledge sources (Obsidian, Documents, Datasets, Codebase).
 *
 * 100% On-Premise, Air-Gapped, Zero External Dependencies.
 */

import fs from 'node:fs';
import path from 'node:path';
import { obsidianConfig } from './obsidian-config.js';
import { obsidianIndexer } from './obsidian-indexer.js';

export const KnowledgeSourceType = {
  OBSIDIAN: 'OBSIDIAN',
  DOCUMENTS: 'DOCUMENTS',
  DATASETS: 'DATASETS',
  CODEBASE: 'CODEBASE'
};

export class SourceRegistry {
  constructor(options = {}) {
    this.config = options.config || obsidianConfig;
    this.indexer = options.indexer || obsidianIndexer;
    this.registryPath = path.join(this.config.indexDir, 'sources-registry.json');
    this.sources = new Map();

    this._initDefaultSources();
  }

  _initDefaultSources() {
    // 1. Obsidian Vault Source
    this.sources.set('src_obsidian_vault', {
      source_id: 'src_obsidian_vault',
      type: KnowledgeSourceType.OBSIDIAN,
      name: '301 Super AI Obsidian Vault',
      path: this.config.vaultPath,
      enabled: true,
      priority: 'high',
      status: 'READY',
      description: 'Authoritative Markdown notes, architectures, models, and domain research.'
    });

    // 2. Enterprise Document Store (PDF/DOCX)
    this.sources.set('src_enterprise_docs', {
      source_id: 'src_enterprise_docs',
      type: KnowledgeSourceType.DOCUMENTS,
      name: 'Industrial Standards & Manuals',
      path: path.join(this.config.projectRoot, 'data', 'rag'),
      enabled: true,
      priority: 'high',
      status: 'READY',
      description: 'OISD, API-653, and confidential plant inspection documentation.'
    });

    // 3. Tabular Datasets (CSV/XLSX)
    this.sources.set('src_datasets', {
      source_id: 'src_datasets',
      type: KnowledgeSourceType.DATASETS,
      name: 'Domain Datasets (SQL)',
      path: path.join(this.config.projectRoot, 'data', 'datasets'),
      enabled: true,
      priority: 'standard',
      status: 'READY',
      description: 'Tabular sensor logs, inspections, and training datasets.'
    });

    // 4. Codebase Architecture
    this.sources.set('src_codebase', {
      source_id: 'src_codebase',
      type: KnowledgeSourceType.CODEBASE,
      name: '301 Sovereign Platform Codebase',
      path: this.config.projectRoot,
      enabled: true,
      priority: 'standard',
      status: 'READY',
      description: 'Platform codebase, agents, tools, and orchestrator architecture.'
    });

    this._loadPersistedSources();
  }

  _loadPersistedSources() {
    try {
      if (fs.existsSync(this.registryPath)) {
        const raw = fs.readFileSync(this.registryPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(s => {
            if (s.source_id && this.sources.has(s.source_id)) {
              this.sources.set(s.source_id, { ...this.sources.get(s.source_id), ...s });
            }
          });
        }
      }
    } catch {
      // Graceful fallback
    }
  }

  _saveSources() {
    try {
      this.config.ensureDirectories();
      const arr = Array.from(this.sources.values());
      fs.writeFileSync(this.registryPath, JSON.stringify(arr, null, 2), 'utf8');
    } catch (err) {
      console.warn('[SOURCE_REGISTRY_SAVE_WARN]', err.message);
    }
  }

  listSources() {
    const obsidianStatus = this.indexer.getIndexStatus();

    // Dynamically refresh Obsidian live counters
    const obs = this.sources.get('src_obsidian_vault');
    if (obs) {
      obs.document_count = obsidianStatus.totalNotes;
      obs.chunk_count = obsidianStatus.totalChunks;
      obs.last_sync = obsidianStatus.lastSync;
      obs.status = obsidianStatus.status;
      obs.path = this.config.vaultPath;
    }

    return Array.from(this.sources.values());
  }

  getAllSources() {
    return this.listSources();
  }

  getSource(sourceId) {
    if (!sourceId) return null;
    if (this.sources.has(sourceId)) return this.sources.get(sourceId);
    const cleanId = sourceId.replace(/[-_]/g, '').toLowerCase().replace('source', 'src');
    for (const [id, s] of this.sources.entries()) {
      const cleanKey = id.replace(/[-_]/g, '').toLowerCase();
      if (cleanKey === cleanId || cleanKey.includes(cleanId) || cleanId.includes(cleanKey)) {
        return s;
      }
    }
    return null;
  }

  getSystemStats() {
    return {
      totalSources: this.sources.size,
      isAirGapped: true,
      externalCalls: 0
    };
  }

  updateSource(sourceId, updates = {}) {
    const existing = this.sources.get(sourceId);
    if (!existing) return null;

    const updated = { ...existing, ...updates };
    this.sources.set(sourceId, updated);
    this._saveSources();
    return updated;
  }
}

export const sourceRegistry = new SourceRegistry();
