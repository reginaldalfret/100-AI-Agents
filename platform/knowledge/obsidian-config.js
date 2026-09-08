/**
 * Sovereign AI Workbench — Obsidian Knowledge Bridge Centralized Configuration
 * 100% On-Premise, Air-Gapped, E: Drive Storage Policy (Zero C:\ Footprint).
 */

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_ROOT = process.env.PROJECT_ROOT || path.resolve(__dirname, '../..');

export const VAULT_SUBDIRECTORIES = [
  '00-Inbox',
  '01-Architecture',
  '02-Models',
  '03-Agents',
  '04-Fine-Tuning',
  '05-Datasets',
  '06-Mobile-LLM',
  '07-Quantization',
  '08-Ollama',
  '09-RAG',
  '10-Benchmarks',
  '11-Experiments',
  '12-Cybersecurity',
  '13-Healthcare',
  '14-Industrial',
  '15-Hackathon',
  '99-Archive'
];

export const DEFAULT_EXCLUSIONS = [
  '.obsidian',
  '.trash',
  'node_modules',
  '.git',
  'build',
  'dist',
  'temp',
  'tmp',
  'coverage',
  '.venv',
  'venv',
  '__pycache__'
];

export const SECRET_EXCLUSION_PATTERNS = [
  /^\.env(\..+)?$/i,
  /credentials/i,
  /id_rsa/i,
  /id_ed25519/i,
  /\.pem$/i,
  /\.key$/i,
  /private_key/i,
  /api[_-]?secret/i,
  /token/i,
  /password/i
];

class ObsidianConfig {
  constructor() {
    this.projectRoot = DEFAULT_ROOT;
    this.configPath = path.join(this.projectRoot, 'knowledge', 'obsidian-config.json');

    // Load persisted config or defaults
    const persisted = this._loadPersistedConfig();

    this.vaultPath = process.env.OBSIDIAN_VAULT_PATH || 
                     persisted.vaultPath || 
                     path.join(this.projectRoot, 'knowledge', 'obsidian-vault');

    this.indexDir = process.env.KNOWLEDGE_INDEX_DIR || 
                    persisted.indexDir || 
                    path.join(this.projectRoot, 'knowledge', 'index');

    this.embeddingsDir = process.env.KNOWLEDGE_EMBEDDINGS_DIR || 
                         persisted.embeddingsDir || 
                         path.join(this.projectRoot, 'knowledge', 'embeddings');

    this.vectorStoreDir = process.env.KNOWLEDGE_VECTOR_STORE_DIR || 
                          persisted.vectorStoreDir || 
                          path.join(this.projectRoot, 'knowledge', 'vector-store');

    this.logsDir = process.env.KNOWLEDGE_LOGS_DIR || 
                   persisted.logsDir || 
                   path.join(this.projectRoot, 'logs', 'knowledge');

    this.manifestFile = path.join(this.indexDir, 'obsidian-manifest.json');
    this.graphFile = path.join(this.indexDir, 'obsidian-graph.json');
    this.baseDir = this.projectRoot;
    this.indexPath = this.indexDir;
    this.embeddingsPath = this.embeddingsDir;
    this.vectorsPath = this.vectorStoreDir;

    this.autoSync = persisted.autoSync !== undefined ? persisted.autoSync : true;
    this.syncIntervalMs = persisted.syncIntervalMs || 60000;
    this.retrievalTopK = persisted.retrievalTopK || 5;
    this.customExclusions = persisted.customExclusions || [];
    this.embeddingModel = 'sovereign-dense-384-cpu';
    this.knowledgePriority = 'high'; // high | standard | secondary
  }

  _loadPersistedConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf8');
        return JSON.parse(raw);
      }
    } catch {
      // Return defaults on parse error
    }
    return {};
  }

  saveConfig(updates = {}) {
    if (updates.vaultPath) this.vaultPath = path.resolve(updates.vaultPath);
    if (updates.autoSync !== undefined) this.autoSync = Boolean(updates.autoSync);
    if (updates.syncIntervalMs) this.syncIntervalMs = Number(updates.syncIntervalMs);
    if (updates.retrievalTopK) this.retrievalTopK = Number(updates.retrievalTopK);
    if (Array.isArray(updates.customExclusions)) this.customExclusions = updates.customExclusions;
    if (updates.knowledgePriority) this.knowledgePriority = updates.knowledgePriority;

    const data = {
      vaultPath: this.vaultPath,
      indexDir: this.indexDir,
      embeddingsDir: this.embeddingsDir,
      vectorStoreDir: this.vectorStoreDir,
      logsDir: this.logsDir,
      autoSync: this.autoSync,
      syncIntervalMs: this.syncIntervalMs,
      retrievalTopK: this.retrievalTopK,
      customExclusions: this.customExclusions,
      knowledgePriority: this.knowledgePriority,
      updatedAt: new Date().toISOString()
    };

    try {
      const parent = path.dirname(this.configPath);
      if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
      fs.writeFileSync(this.configPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.warn('[OBSIDIAN_CONFIG_SAVE_WARN]', err.message);
    }
    return data;
  }

  /**
   * Checks if a filename or path represents a confidential / secret file that must not be ingested.
   */
  isSecretFile(filepath) {
    if (!filepath || typeof filepath !== 'string') return false;
    const filename = path.basename(filepath);
    for (const pattern of SECRET_EXCLUSION_PATTERNS) {
      if (pattern.test(filename)) return true;
    }
    const parts = filepath.split(/[/\\]/);
    for (const part of parts) {
      if (DEFAULT_EXCLUSIONS.includes(part)) return true;
    }
    return false;
  }

  /**
   * Validates if a file path is safely within the approved vault root.
   * Protects against path traversal, symlink escape, and forbidden files.
   */
  isPathSafe(targetPath) {
    if (!targetPath || typeof targetPath !== 'string') return false;
    const resolvedTarget = path.resolve(targetPath);
    const resolvedVault = path.resolve(this.vaultPath);

    // Prevent path traversal outside vault
    if (!resolvedTarget.startsWith(resolvedVault)) {
      return false;
    }

    // Check if path contains forbidden segments
    const rel = path.relative(resolvedVault, resolvedTarget);
    const segments = rel.split(path.sep);

    for (const seg of segments) {
      if (DEFAULT_EXCLUSIONS.includes(seg) || this.customExclusions.includes(seg)) {
        return false;
      }
    }

    // Check secret file patterns
    const filename = path.basename(resolvedTarget);
    for (const pattern of SECRET_EXCLUSION_PATTERNS) {
      if (pattern.test(filename)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Verifies if a file is a symbolic link escaping the approved vault root.
   */
  isSymlinkEscape(targetPath) {
    try {
      const lstat = fs.lstatSync(targetPath);
      if (lstat.isSymbolicLink()) {
        const realTarget = fs.realpathSync(targetPath);
        const resolvedVault = path.resolve(this.vaultPath);
        if (!realTarget.startsWith(resolvedVault)) {
          return true; // Symlink escapes vault
        }
      }
    } catch {
      // If inaccessible, treat conservatively
    }
    return false;
  }

  ensureDirectories() {
    [this.vaultPath, this.indexDir, this.embeddingsDir, this.vectorStoreDir, this.logsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Ensure default subdirectories in vault
    VAULT_SUBDIRECTORIES.forEach(sub => {
      const subDir = path.join(this.vaultPath, sub);
      if (!fs.existsSync(subDir)) {
        fs.mkdirSync(subDir, { recursive: true });
      }
    });
  }

  toJSON() {
    return {
      vaultPath: this.vaultPath,
      autoSync: this.autoSync,
      syncIntervalMs: this.syncIntervalMs,
      retrievalTopK: this.retrievalTopK,
      customExclusions: this.customExclusions,
      knowledgePriority: this.knowledgePriority
    };
  }
}

export const obsidianConfig = new ObsidianConfig();
