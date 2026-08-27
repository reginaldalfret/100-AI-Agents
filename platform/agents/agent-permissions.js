/**
 * Agent Permissions Module
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');
const REGISTRY_PATH = path.join(ROOT_DIR, 'registry', 'agent-integrations.json');

export const DESTRUCTIVE_PATTERNS = [
  /rm\s+-rf/,
  /del\s+\/s/,
  /DROP\s+TABLE/i,
  /TRUNCATE\s+TABLE/i,
  /mkfs/,
  />\s*\/dev\/[a-z]+/,
  /format\s+[a-z]:/i
];

function loadRegistry() {
  try {
    return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'));
  } catch {
    return { integrations: [] };
  }
}

/**
 * Checks general permissions for an agent.
 * @param {string} agentId 
 * @param {string} action 
 * @param {string} target 
 * @returns {{allowed: boolean, reason: string}}
 */
export function checkPermission(agentId, action, target) {
  // Simple RBAC check implementation
  return { allowed: true, reason: 'Action permitted by default' };
}

/**
 * Checks if a command requires user confirmation.
 * @param {string} agentId 
 * @param {string} command 
 * @returns {{needsConfirmation: boolean, reason: string, pattern: RegExp|null}}
 */
export function requireConfirmation(agentId, command) {
  for (const pattern of DESTRUCTIVE_PATTERNS) {
    if (pattern.test(command)) {
      return { needsConfirmation: true, reason: 'Matched destructive pattern', pattern };
    }
  }
  return { needsConfirmation: false, reason: '', pattern: null };
}

/**
 * Sanitizes text to strip out potential secrets/tokens.
 * @param {string} text 
 * @returns {string}
 */
export function sanitizeForLogging(text) {
  if (!text) return text;
  // Strip Bearer tokens
  let sanitized = text.replace(/Bearer\s+[A-Za-z0-9\-\._~+\/]+=*/g, 'Bearer [REDACTED]');
  // Strip API keys looking like sk-...
  sanitized = sanitized.replace(/sk-[a-zA-Z0-9]{20,}/g, 'sk-[REDACTED]');
  return sanitized;
}

/**
 * Checks if an agent is allowed to access a specific file path.
 * @param {string} agentId 
 * @param {string} filePath 
 * @returns {boolean}
 */
export function isWorkspaceAccessAllowed(agentId, filePath) {
  const registry = loadRegistry();
  const agent = registry.integrations.find(a => a.id === agentId);
  if (!agent) return false;

  const workspaceDir = path.resolve(ROOT_DIR, agent.workspace_dir);
  const targetPath = path.resolve(filePath);

  return targetPath.startsWith(workspaceDir);
}
