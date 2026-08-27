/**
 * Agent Discovery Module
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');
const REGISTRY_PATH = path.join(ROOT_DIR, 'registry', 'agent-integrations.json');

/**
 * Loads the agent registry.
 */
function loadRegistry() {
  try {
    const data = fs.readFileSync(REGISTRY_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load agent registry:', err.message);
    return { integrations: [] };
  }
}

/**
 * Gets the binary path of an agent.
 * @param {string} agentId 
 * @returns {string|null}
 */
export function getAgentBinaryPath(agentId) {
  const registry = loadRegistry();
  const agent = registry.integrations.find(a => a.id === agentId);
  if (!agent) return null;
  
  try {
    const stdout = execSync(`where.exe ${agent.binary_name}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
    const paths = stdout.split('\n').map(p => p.trim()).filter(Boolean);
    return paths.length > 0 ? paths[0] : null;
  } catch (err) {
    return null;
  }
}

/**
 * Discovers a specific agent.
 * @param {string} agentId 
 * @returns {Promise<{id: string, installed: boolean, path: string|null, version: string|null}>}
 */
export async function discoverAgent(agentId) {
  const registry = loadRegistry();
  const agent = registry.integrations.find(a => a.id === agentId);
  if (!agent) return { id: agentId, installed: false, path: null, version: null };

  const binPath = getAgentBinaryPath(agentId);
  if (!binPath) {
    return { id: agentId, installed: false, path: null, version: null };
  }

  let version = null;
  try {
    const { command, args } = agent.install_check;
    const versionOutput = execSync(`${command} ${args.join(' ')}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
    version = versionOutput.trim();
  } catch (err) {
    // Cannot determine version
  }

  return { id: agentId, installed: true, path: binPath, version };
}

/**
 * Discovers all installed agents.
 * @returns {Promise<Array<{id: string, installed: boolean, path: string|null, version: string|null}>>}
 */
export async function discoverAllAgents() {
  const registry = loadRegistry();
  const promises = registry.integrations.map(agent => discoverAgent(agent.id));
  return Promise.all(promises);
}
